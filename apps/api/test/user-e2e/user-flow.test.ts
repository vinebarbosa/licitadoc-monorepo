import assert from "node:assert/strict";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import {
  createAdminActor,
  createManagedUser,
  createMemberActor,
  createOrganizationOwnerActor,
} from "../e2e/helpers/actors";
import { cleanupApiE2EState, createOrganizationFixture } from "../e2e/helpers/fixtures";
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

type UserResponse = {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  image: string | null;
  name: string;
  organizationId: string | null;
  role: "admin" | "organization_owner" | "member";
  updatedAt: string;
};

type PaginatedUsersResponse = {
  items: UserResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DeleteResponse = {
  success: true;
};

type ErrorResponse = {
  details: unknown;
  error: string;
  message: string;
};

const ADMIN_EMAIL = "user-e2e-admin@licitadoc.test";
const OWNER_EMAIL = "user-e2e-owner@licitadoc.test";
const MEMBER_ACTOR_EMAIL = "user-e2e-member-actor@licitadoc.test";
const OWNER_SCOPE_MEMBER_EMAIL = "user-e2e-owner-scope-member@licitadoc.test";
const OTHER_ORG_MEMBER_EMAIL = "user-e2e-other-org-member@licitadoc.test";
const ADMIN_TARGET_EMAIL = "user-e2e-admin-target@licitadoc.test";
const OWNER_UPDATE_MEMBER_EMAIL = "user-e2e-owner-update-member@licitadoc.test";
const OWNER_DELETE_MEMBER_EMAIL = "user-e2e-owner-delete-member@licitadoc.test";
const PRIVILEGED_OWNER_EMAIL = "user-e2e-privileged-owner@licitadoc.test";

const OWNER_ORG_SLUG = "user-e2e-owner-org";
const OTHER_ORG_SLUG = "user-e2e-other-org";
const ADMIN_SOURCE_ORG_SLUG = "user-e2e-admin-source-org";
const ADMIN_TARGET_ORG_SLUG = "user-e2e-admin-target-org";

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

async function findUserById(userId: string) {
  return server.app.db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, userId),
  });
}

describe("user management E2E coverage", () => {
  test("admin lists users across organizations and reads a target user's detail", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "User Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "User Owner",
      organization: {
        cnpj: "71000000000001",
        name: "User Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "71000000000002",
      createdByUserId: admin.user.id,
      name: "User Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const otherOrgMember = await createManagedUser(server, {
      email: OTHER_ORG_MEMBER_EMAIL,
      name: "Other Org Member",
      organizationId: otherOrganization.id,
    });

    const listResponse = await request(server, "/api/users/", {
      cookieJar: admin.cookieJar,
    });
    const listBody = await readJson<PaginatedUsersResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.page, 1);
    assert.equal(listBody.pageSize, 20);
    assert.equal(listBody.total, 3);
    assert.equal(listBody.totalPages, 1);

    const listedEmails = new Set(listBody.items.map((user) => user.email));

    assert.equal(listedEmails.has(ADMIN_EMAIL), true);
    assert.equal(listedEmails.has(OWNER_EMAIL), true);
    assert.equal(listedEmails.has(OTHER_ORG_MEMBER_EMAIL), true);
    assert.equal(
      listBody.items.some((user) => user.role === "admin"),
      true,
    );
    assert.equal(
      listBody.items.some((user) => user.organizationId === owner.organization.id),
      true,
    );

    const detailResponse = await request(server, `/api/users/${otherOrgMember.id}`, {
      cookieJar: admin.cookieJar,
    });
    const detailBody = await readJson<UserResponse>(detailResponse);

    assert.equal(detailResponse.status, 200);
    assert.ok(detailBody);
    assert.equal(detailBody.id, otherOrgMember.id);
    assert.equal(detailBody.email, OTHER_ORG_MEMBER_EMAIL);
    assert.equal(detailBody.organizationId, otherOrganization.id);
    assert.equal(detailBody.role, "member");
  });

  test("organization owners list only same-organization users and cannot read outside their scope", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "User Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "User Owner",
      organization: {
        cnpj: "72000000000001",
        name: "User Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const sameOrgMember = await createManagedUser(server, {
      email: OWNER_SCOPE_MEMBER_EMAIL,
      name: "Owner Scope Member",
      organizationId: owner.organization.id,
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "72000000000002",
      createdByUserId: admin.user.id,
      name: "User Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const otherOrgMember = await createManagedUser(server, {
      email: OTHER_ORG_MEMBER_EMAIL,
      name: "Other Org Member",
      organizationId: otherOrganization.id,
    });

    const listResponse = await request(server, "/api/users/", {
      cookieJar: owner.cookieJar,
    });
    const listBody = await readJson<PaginatedUsersResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.total, 2);
    assert.equal(listBody.totalPages, 1);

    const listedEmails = new Set(listBody.items.map((user) => user.email));

    assert.equal(listedEmails.has(OWNER_EMAIL), true);
    assert.equal(listedEmails.has(OWNER_SCOPE_MEMBER_EMAIL), true);
    assert.equal(listedEmails.has(OTHER_ORG_MEMBER_EMAIL), false);

    const sameOrgDetailResponse = await request(server, `/api/users/${sameOrgMember.id}`, {
      cookieJar: owner.cookieJar,
    });
    const sameOrgDetailBody = await readJson<UserResponse>(sameOrgDetailResponse);

    assert.equal(sameOrgDetailResponse.status, 200);
    assert.ok(sameOrgDetailBody);
    assert.equal(sameOrgDetailBody.email, OWNER_SCOPE_MEMBER_EMAIL);
    assert.equal(sameOrgDetailBody.organizationId, owner.organization.id);

    const outsideScopeDetailResponse = await request(server, `/api/users/${otherOrgMember.id}`, {
      cookieJar: owner.cookieJar,
    });

    assert.equal(outsideScopeDetailResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeDetailResponse), {
      error: "forbidden",
      message: "You do not have permission to read this user.",
      details: null,
    });
  });

  test("admins can update managed users and persist role and organization changes", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "User Admin",
    });
    const sourceOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "73000000000001",
      createdByUserId: admin.user.id,
      name: "Admin Source Org",
      slug: ADMIN_SOURCE_ORG_SLUG,
    });
    const targetOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "73000000000002",
      createdByUserId: admin.user.id,
      name: "Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });
    const targetUser = await createManagedUser(server, {
      email: ADMIN_TARGET_EMAIL,
      name: "Admin Managed User",
      organizationId: sourceOrganization.id,
    });

    const updateResponse = await request(server, `/api/users/${targetUser.id}`, {
      method: "PATCH",
      cookieJar: admin.cookieJar,
      body: {
        name: "Updated Admin Managed User",
        role: "organization_owner",
        organizationId: targetOrganization.id,
      },
    });
    const updateBody = await readJson<UserResponse>(updateResponse);

    assert.equal(updateResponse.status, 200);
    assert.ok(updateBody);
    assert.equal(updateBody.name, "Updated Admin Managed User");
    assert.equal(updateBody.role, "organization_owner");
    assert.equal(updateBody.organizationId, targetOrganization.id);

    const persistedUser = await findUserById(targetUser.id);

    assert.ok(persistedUser);
    assert.equal(persistedUser.name, "Updated Admin Managed User");
    assert.equal(persistedUser.role, "organization_owner");
    assert.equal(persistedUser.organizationId, targetOrganization.id);
  });

  test("organization owners can update and delete members in the same organization", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "User Owner",
      organization: {
        cnpj: "74000000000001",
        name: "User Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const updateTarget = await createManagedUser(server, {
      email: OWNER_UPDATE_MEMBER_EMAIL,
      name: "Owner Update Target",
      organizationId: owner.organization.id,
    });
    const deleteTarget = await createManagedUser(server, {
      email: OWNER_DELETE_MEMBER_EMAIL,
      name: "Owner Delete Target",
      organizationId: owner.organization.id,
    });

    const updateResponse = await request(server, `/api/users/${updateTarget.id}`, {
      method: "PATCH",
      cookieJar: owner.cookieJar,
      body: {
        name: "Updated Same Org Member",
      },
    });
    const updateBody = await readJson<UserResponse>(updateResponse);

    assert.equal(updateResponse.status, 200);
    assert.ok(updateBody);
    assert.equal(updateBody.name, "Updated Same Org Member");
    assert.equal(updateBody.role, "member");
    assert.equal(updateBody.organizationId, owner.organization.id);

    const persistedUpdatedUser = await findUserById(updateTarget.id);

    assert.ok(persistedUpdatedUser);
    assert.equal(persistedUpdatedUser.name, "Updated Same Org Member");

    const deleteResponse = await request(server, `/api/users/${deleteTarget.id}`, {
      method: "DELETE",
      cookieJar: owner.cookieJar,
    });
    const deleteBody = await readJson<DeleteResponse>(deleteResponse);

    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(deleteBody, {
      success: true,
    });
    assert.equal(await findUserById(deleteTarget.id), undefined);
  });

  test("unauthenticated and member actors cannot use user-management routes", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "User Admin",
    });
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "75000000000001",
      createdByUserId: admin.user.id,
      name: "Admin Source Org",
      slug: ADMIN_SOURCE_ORG_SLUG,
    });
    const targetUser = await createManagedUser(server, {
      email: ADMIN_TARGET_EMAIL,
      name: "Managed Target User",
      organizationId: organization.id,
    });
    const member = await createMemberActor(server, {
      email: MEMBER_ACTOR_EMAIL,
      name: "User Member",
    });

    const anonymousListResponse = await request(server, "/api/users/");
    const anonymousReadResponse = await request(server, `/api/users/${targetUser.id}`);
    const anonymousUpdateResponse = await request(server, `/api/users/${targetUser.id}`, {
      method: "PATCH",
      body: {
        name: "Should Not Work",
      },
    });
    const anonymousDeleteResponse = await request(server, `/api/users/${targetUser.id}`, {
      method: "DELETE",
    });

    for (const response of [
      anonymousListResponse,
      anonymousReadResponse,
      anonymousUpdateResponse,
      anonymousDeleteResponse,
    ]) {
      assert.equal(response.status, 401);
      assert.deepEqual(await readJson<ErrorResponse>(response), {
        error: "unauthorized",
        message: "Authentication required.",
        details: null,
      });
    }

    const memberListResponse = await request(server, "/api/users/", {
      cookieJar: member.cookieJar,
    });
    const memberReadResponse = await request(server, `/api/users/${targetUser.id}`, {
      cookieJar: member.cookieJar,
    });
    const memberUpdateResponse = await request(server, `/api/users/${targetUser.id}`, {
      method: "PATCH",
      cookieJar: member.cookieJar,
      body: {
        name: "Should Still Not Work",
      },
    });
    const memberDeleteResponse = await request(server, `/api/users/${targetUser.id}`, {
      method: "DELETE",
      cookieJar: member.cookieJar,
    });

    assert.equal(memberListResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberListResponse), {
      error: "forbidden",
      message: "You do not have permission to list users.",
      details: null,
    });

    assert.equal(memberReadResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberReadResponse), {
      error: "forbidden",
      message: "You do not have permission to read this user.",
      details: null,
    });

    assert.equal(memberUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to manage this user.",
      details: null,
    });

    assert.equal(memberDeleteResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberDeleteResponse), {
      error: "forbidden",
      message: "You do not have permission to manage this user.",
      details: null,
    });

    const persistedTargetUser = await findUserById(targetUser.id);

    assert.ok(persistedTargetUser);
    assert.equal(persistedTargetUser.name, "Managed Target User");
  });

  test("organization owners cannot manage users outside their allowed scope", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "User Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "User Owner",
      organization: {
        cnpj: "76000000000001",
        name: "User Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "76000000000002",
      createdByUserId: admin.user.id,
      name: "User Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const outsideScopeMember = await createManagedUser(server, {
      email: OTHER_ORG_MEMBER_EMAIL,
      name: "Outside Scope Member",
      organizationId: otherOrganization.id,
    });
    const privilegedOwner = await createManagedUser(server, {
      email: PRIVILEGED_OWNER_EMAIL,
      name: "Privileged Same Org Owner",
      organizationId: owner.organization.id,
      role: "organization_owner",
    });

    const outsideScopeUpdateResponse = await request(
      server,
      `/api/users/${outsideScopeMember.id}`,
      {
        method: "PATCH",
        cookieJar: owner.cookieJar,
        body: {
          name: "Should Fail",
        },
      },
    );

    assert.equal(outsideScopeUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to manage this user.",
      details: null,
    });

    const privilegedDeleteResponse = await request(server, `/api/users/${privilegedOwner.id}`, {
      method: "DELETE",
      cookieJar: owner.cookieJar,
    });

    assert.equal(privilegedDeleteResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(privilegedDeleteResponse), {
      error: "forbidden",
      message: "You do not have permission to manage this user.",
      details: null,
    });

    const persistedOutsideScopeMember = await findUserById(outsideScopeMember.id);
    const persistedPrivilegedOwner = await findUserById(privilegedOwner.id);

    assert.ok(persistedOutsideScopeMember);
    assert.equal(persistedOutsideScopeMember.name, "Outside Scope Member");
    assert.ok(persistedPrivilegedOwner);
    assert.equal(persistedPrivilegedOwner.role, "organization_owner");
  });
});
