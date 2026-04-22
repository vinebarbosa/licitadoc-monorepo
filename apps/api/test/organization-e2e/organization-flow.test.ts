import assert from "node:assert/strict";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import {
  createAdminActor,
  createMemberActor,
  createOrganizationOwnerActor,
  createOrganizationOwnerWithoutOrganizationActor,
} from "../e2e/helpers/actors";
import {
  cleanupApiE2EState,
  createOrganizationFixture,
  getOrganizationById,
  getOrganizationBySlug,
  getUserByEmail,
} from "../e2e/helpers/fixtures";
import { readJson, request } from "../e2e/helpers/http";
import {
  API_E2E_TEST_EMAILS,
  API_E2E_TEST_ORGANIZATION_SLUGS,
} from "../e2e/helpers/known-fixtures";
import {
  type ApiTestServer,
  getListeningOrigin,
  startTestServer,
} from "../e2e/helpers/test-server";

type OrganizationResponse = {
  address: string;
  authorityName: string;
  authorityRole: string;
  city: string;
  cnpj: string;
  createdAt: string;
  createdByUserId: string;
  id: string;
  institutionalEmail: string;
  isActive: boolean;
  logoUrl: string | null;
  name: string;
  officialName: string;
  phone: string;
  slug: string;
  state: string;
  updatedAt: string;
  website: string | null;
  zipCode: string;
};

type PaginatedOrganizationsResponse = {
  items: OrganizationResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ErrorResponse = {
  details: unknown;
  error: string;
  message: string;
};

type OrganizationPayloadInput = {
  cnpj: string;
  name: string;
  slug: string;
  website?: string | null;
};

const ADMIN_EMAIL = "organization-e2e-admin@licitadoc.test";
const UNLINKED_OWNER_EMAIL = "organization-e2e-unlinked-owner@licitadoc.test";
const LINKED_OWNER_EMAIL = "organization-e2e-linked-owner@licitadoc.test";
const MEMBER_EMAIL = "organization-e2e-member@licitadoc.test";

const ONBOARDING_ORG_SLUG = "organization-e2e-onboarding-org";
const OWNER_ORG_SLUG = "organization-e2e-owner-org";
const OTHER_ORG_SLUG = "organization-e2e-other-org";
const ADMIN_TARGET_ORG_SLUG = "organization-e2e-admin-target-org";
const ADMIN_ATTEMPT_ORG_SLUG = "organization-e2e-admin-attempt-org";
const MEMBER_ATTEMPT_ORG_SLUG = "organization-e2e-member-attempt-org";
const REPEAT_ATTEMPT_ORG_SLUG = "organization-e2e-repeat-attempt-org";

let server: ApiTestServer;

beforeAll(async () => {
  server = await startTestServer();
  assert.equal(getListeningOrigin(server.app), server.baseUrl);
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

beforeEach(async () => {
  await cleanupApiE2EState(server.app.db, {
    emails: [...API_E2E_TEST_EMAILS],
    organizationSlugs: [...API_E2E_TEST_ORGANIZATION_SLUGS],
  });
});

function buildOrganizationPayload({
  cnpj,
  name,
  slug,
  website = `https://${slug}.example.com`,
}: OrganizationPayloadInput) {
  return {
    name,
    slug,
    officialName: `${name} Oficial`,
    cnpj,
    city: "Fortaleza",
    state: "CE",
    address: `${name} - Endereco de teste`,
    zipCode: "60000-000",
    phone: "(85) 3333-0000",
    institutionalEmail: `${slug}@licitadoc.test`,
    website,
    logoUrl: null,
    authorityName: "Responsavel de Teste",
    authorityRole: "Prefeita",
  };
}

describe("organization management E2E coverage", () => {
  test("organization owners without organization can create an organization through onboarding", async () => {
    const owner = await createOrganizationOwnerWithoutOrganizationActor(server, {
      email: UNLINKED_OWNER_EMAIL,
      name: "Organization Pending Owner",
    });

    const createResponse = await request(server, "/api/organizations/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildOrganizationPayload({
        cnpj: "81000000000001",
        name: "Organization Onboarding Org",
        slug: ONBOARDING_ORG_SLUG,
      }),
    });
    const createBody = await readJson<OrganizationResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createBody);
    assert.equal(createBody.slug, ONBOARDING_ORG_SLUG);
    assert.equal(createBody.name, "Organization Onboarding Org");
    assert.equal(createBody.createdByUserId, owner.user.id);
    assert.equal(createBody.isActive, true);

    const persistedOrganization = await getOrganizationById(server.app.db, createBody.id);
    const persistedOwner = await getUserByEmail(server.app.db, UNLINKED_OWNER_EMAIL);

    assert.ok(persistedOrganization);
    assert.equal(persistedOrganization.slug, ONBOARDING_ORG_SLUG);
    assert.equal(persistedOrganization.createdByUserId, owner.user.id);
    assert.ok(persistedOwner);
    assert.equal(persistedOwner.organizationId, createBody.id);
    assert.equal(persistedOwner.role, "organization_owner");
  });

  test("admins list organizations across scope and read target details", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Organization Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: LINKED_OWNER_EMAIL,
      name: "Organization Owner",
      organization: {
        cnpj: "82000000000001",
        name: "Organization Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "82000000000002",
      createdByUserId: admin.user.id,
      name: "Organization Other Org",
      slug: OTHER_ORG_SLUG,
    });

    const listResponse = await request(server, "/api/organizations/", {
      cookieJar: admin.cookieJar,
    });
    const listBody = await readJson<PaginatedOrganizationsResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.page, 1);
    assert.equal(listBody.pageSize, 20);
    assert.equal(listBody.total, 2);
    assert.equal(listBody.totalPages, 1);

    const listedIds = new Set(listBody.items.map((organization) => organization.id));

    assert.equal(listedIds.has(owner.organization.id), true);
    assert.equal(listedIds.has(otherOrganization.id), true);

    const detailResponse = await request(server, `/api/organizations/${otherOrganization.id}`, {
      cookieJar: admin.cookieJar,
    });
    const detailBody = await readJson<OrganizationResponse>(detailResponse);

    assert.equal(detailResponse.status, 200);
    assert.ok(detailBody);
    assert.equal(detailBody.id, otherOrganization.id);
    assert.equal(detailBody.slug, OTHER_ORG_SLUG);
    assert.equal(detailBody.createdByUserId, admin.user.id);
  });

  test("organization owners list only their own organization and cannot read outside their scope", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Organization Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: LINKED_OWNER_EMAIL,
      name: "Organization Owner",
      organization: {
        cnpj: "83000000000001",
        name: "Organization Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "83000000000002",
      createdByUserId: admin.user.id,
      name: "Organization Other Org",
      slug: OTHER_ORG_SLUG,
    });

    const listResponse = await request(server, "/api/organizations/", {
      cookieJar: owner.cookieJar,
    });
    const listBody = await readJson<PaginatedOrganizationsResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.total, 1);
    assert.equal(listBody.totalPages, 1);
    assert.equal(listBody.items.length, 1);
    assert.equal(listBody.items[0]?.id, owner.organization.id);

    const detailResponse = await request(server, `/api/organizations/${owner.organization.id}`, {
      cookieJar: owner.cookieJar,
    });
    const detailBody = await readJson<OrganizationResponse>(detailResponse);

    assert.equal(detailResponse.status, 200);
    assert.ok(detailBody);
    assert.equal(detailBody.id, owner.organization.id);
    assert.equal(detailBody.slug, OWNER_ORG_SLUG);

    const outsideScopeResponse = await request(
      server,
      `/api/organizations/${otherOrganization.id}`,
      {
        cookieJar: owner.cookieJar,
      },
    );

    assert.equal(outsideScopeResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeResponse), {
      error: "forbidden",
      message: "You do not have permission to read this organization.",
      details: null,
    });
  });

  test("admins can update organizations and persist administrative fields", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Organization Admin",
    });
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "84000000000001",
      createdByUserId: admin.user.id,
      name: "Organization Admin Target",
      slug: ADMIN_TARGET_ORG_SLUG,
    });

    const updateResponse = await request(server, `/api/organizations/${organization.id}`, {
      method: "PATCH",
      cookieJar: admin.cookieJar,
      body: {
        name: "Updated Organization Admin Target",
        slug: "updated-organization-admin-target",
        state: "SP",
        website: null,
        isActive: false,
      },
    });
    const updateBody = await readJson<OrganizationResponse>(updateResponse);

    assert.equal(updateResponse.status, 200);
    assert.ok(updateBody);
    assert.equal(updateBody.name, "Updated Organization Admin Target");
    assert.equal(updateBody.slug, "updated-organization-admin-target");
    assert.equal(updateBody.state, "SP");
    assert.equal(updateBody.website, null);
    assert.equal(updateBody.isActive, false);

    const persistedOrganization = await getOrganizationById(server.app.db, organization.id);

    assert.ok(persistedOrganization);
    assert.equal(persistedOrganization.name, "Updated Organization Admin Target");
    assert.equal(persistedOrganization.slug, "updated-organization-admin-target");
    assert.equal(persistedOrganization.state, "SP");
    assert.equal(persistedOrganization.website, null);
    assert.equal(persistedOrganization.isActive, false);
  });

  test("organization owners can update their profile but cannot change admin-only fields", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: LINKED_OWNER_EMAIL,
      name: "Organization Owner",
      organization: {
        cnpj: "85000000000001",
        name: "Organization Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });

    const updateResponse = await request(server, `/api/organizations/${owner.organization.id}`, {
      method: "PATCH",
      cookieJar: owner.cookieJar,
      body: {
        city: "Sobral",
        website: null,
      },
    });
    const updateBody = await readJson<OrganizationResponse>(updateResponse);

    assert.equal(updateResponse.status, 200);
    assert.ok(updateBody);
    assert.equal(updateBody.city, "Sobral");
    assert.equal(updateBody.website, null);
    assert.equal(updateBody.isActive, true);

    const forbiddenUpdateResponse = await request(
      server,
      `/api/organizations/${owner.organization.id}`,
      {
        method: "PATCH",
        cookieJar: owner.cookieJar,
        body: {
          isActive: false,
        },
      },
    );

    assert.equal(forbiddenUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(forbiddenUpdateResponse), {
      error: "forbidden",
      message: "Organization owners cannot change organization status.",
      details: null,
    });

    const persistedOrganization = await getOrganizationById(server.app.db, owner.organization.id);

    assert.ok(persistedOrganization);
    assert.equal(persistedOrganization.city, "Sobral");
    assert.equal(persistedOrganization.website, null);
    assert.equal(persistedOrganization.isActive, true);
  });

  test("disallowed and already-linked actors cannot create organizations through onboarding", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Organization Admin",
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Organization Member",
    });
    const linkedOwner = await createOrganizationOwnerActor(server, {
      email: LINKED_OWNER_EMAIL,
      name: "Organization Owner",
      organization: {
        cnpj: "86000000000001",
        name: "Organization Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });

    const adminCreateResponse = await request(server, "/api/organizations/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: buildOrganizationPayload({
        cnpj: "86000000000002",
        name: "Organization Admin Attempt Org",
        slug: ADMIN_ATTEMPT_ORG_SLUG,
      }),
    });
    const memberCreateResponse = await request(server, "/api/organizations/", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: buildOrganizationPayload({
        cnpj: "86000000000003",
        name: "Organization Member Attempt Org",
        slug: MEMBER_ATTEMPT_ORG_SLUG,
      }),
    });
    const repeatedCreateResponse = await request(server, "/api/organizations/", {
      method: "POST",
      cookieJar: linkedOwner.cookieJar,
      body: buildOrganizationPayload({
        cnpj: "86000000000004",
        name: "Organization Repeat Attempt Org",
        slug: REPEAT_ATTEMPT_ORG_SLUG,
      }),
    });

    assert.equal(adminCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(adminCreateResponse), {
      error: "forbidden",
      message: "Only organization owners without organization can create an organization.",
      details: null,
    });

    assert.equal(memberCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberCreateResponse), {
      error: "forbidden",
      message: "Only organization owners without organization can create an organization.",
      details: null,
    });

    assert.equal(repeatedCreateResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(repeatedCreateResponse), {
      error: "bad_request",
      message: "You already belong to an organization.",
      details: null,
    });

    assert.equal(await getOrganizationBySlug(server.app.db, ADMIN_ATTEMPT_ORG_SLUG), undefined);
    assert.equal(await getOrganizationBySlug(server.app.db, MEMBER_ATTEMPT_ORG_SLUG), undefined);
    assert.equal(await getOrganizationBySlug(server.app.db, REPEAT_ATTEMPT_ORG_SLUG), undefined);
  });

  test("unauthenticated, member, and out-of-scope actors cannot read or update organizations", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Organization Admin",
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Organization Member",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: LINKED_OWNER_EMAIL,
      name: "Organization Owner",
      organization: {
        cnpj: "87000000000001",
        name: "Organization Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "87000000000002",
      createdByUserId: admin.user.id,
      name: "Organization Other Org",
      slug: OTHER_ORG_SLUG,
    });

    const anonymousResponses = [
      await request(server, "/api/organizations/"),
      await request(server, `/api/organizations/${otherOrganization.id}`),
      await request(server, `/api/organizations/${otherOrganization.id}`, {
        method: "PATCH",
        body: {
          name: "Should Not Work",
        },
      }),
    ];

    for (const response of anonymousResponses) {
      assert.equal(response.status, 401);
      assert.deepEqual(await readJson<ErrorResponse>(response), {
        error: "unauthorized",
        message: "Authentication required.",
        details: null,
      });
    }

    const memberListResponse = await request(server, "/api/organizations/", {
      cookieJar: member.cookieJar,
    });
    const memberReadResponse = await request(server, `/api/organizations/${otherOrganization.id}`, {
      cookieJar: member.cookieJar,
    });
    const memberUpdateResponse = await request(
      server,
      `/api/organizations/${otherOrganization.id}`,
      {
        method: "PATCH",
        cookieJar: member.cookieJar,
        body: {
          name: "Still Should Not Work",
        },
      },
    );

    assert.equal(memberListResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberListResponse), {
      error: "forbidden",
      message: "You do not have permission to list organizations.",
      details: null,
    });

    assert.equal(memberReadResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberReadResponse), {
      error: "forbidden",
      message: "You do not have permission to read this organization.",
      details: null,
    });

    assert.equal(memberUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to update this organization.",
      details: null,
    });

    const outsideScopeReadResponse = await request(
      server,
      `/api/organizations/${otherOrganization.id}`,
      {
        cookieJar: owner.cookieJar,
      },
    );
    const outsideScopeUpdateResponse = await request(
      server,
      `/api/organizations/${otherOrganization.id}`,
      {
        method: "PATCH",
        cookieJar: owner.cookieJar,
        body: {
          city: "Should Fail",
        },
      },
    );

    assert.equal(outsideScopeReadResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeReadResponse), {
      error: "forbidden",
      message: "You do not have permission to read this organization.",
      details: null,
    });

    assert.equal(outsideScopeUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to update this organization.",
      details: null,
    });

    const persistedOrganization = await getOrganizationById(server.app.db, otherOrganization.id);

    assert.ok(persistedOrganization);
    assert.equal(persistedOrganization.city, "Fortaleza");
    assert.equal(persistedOrganization.name, "Organization Other Org");
  });
});
