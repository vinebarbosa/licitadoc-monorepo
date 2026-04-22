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
  createDepartmentFixture,
  createOrganizationFixture,
  getDepartmentById,
  getDepartmentBySlug,
} from "../e2e/helpers/fixtures";
import { readJson, request } from "../e2e/helpers/http";
import {
  API_E2E_TEST_DEPARTMENT_SLUGS,
  API_E2E_TEST_EMAILS,
  API_E2E_TEST_ORGANIZATION_SLUGS,
} from "../e2e/helpers/known-fixtures";
import {
  type ApiTestServer,
  getListeningOrigin,
  startTestServer,
} from "../e2e/helpers/test-server";

type DepartmentResponse = {
  createdAt: string;
  id: string;
  name: string;
  organizationId: string;
  responsibleName: string;
  responsibleRole: string;
  slug: string;
  updatedAt: string;
};

type PaginatedDepartmentsResponse = {
  items: DepartmentResponse[];
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

type DepartmentPayloadInput = {
  name: string;
  organizationId?: string;
  responsibleName?: string;
  responsibleRole?: string;
  slug: string;
};

const ADMIN_EMAIL = "department-e2e-admin@licitadoc.test";
const OWNER_EMAIL = "department-e2e-owner@licitadoc.test";
const MEMBER_EMAIL = "department-e2e-member@licitadoc.test";
const UNSCOPED_MEMBER_EMAIL = "department-e2e-member-no-scope@licitadoc.test";
const UNSCOPED_OWNER_EMAIL = "department-e2e-owner-no-scope@licitadoc.test";

const OWNER_ORG_SLUG = "department-e2e-owner-org";
const OTHER_ORG_SLUG = "department-e2e-other-org";
const ADMIN_TARGET_ORG_SLUG = "department-e2e-admin-target-org";

const ADMIN_CREATED_DEPARTMENT_SLUG = "department-e2e-admin-created";
const OWNER_CREATED_DEPARTMENT_SLUG = "department-e2e-owner-created";
const OWNER_SCOPE_DEPARTMENT_A_SLUG = "department-e2e-owner-scope-a";
const OWNER_SCOPE_DEPARTMENT_B_SLUG = "department-e2e-owner-scope-b";
const OTHER_ORG_DEPARTMENT_SLUG = "department-e2e-other-org";
const ADMIN_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-admin-update-target";
const UPDATED_ADMIN_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-admin-update-target-updated";
const OWNER_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-owner-update-target";
const UPDATED_OWNER_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-owner-update-target-updated";
const CONFLICT_EXISTING_DEPARTMENT_SLUG = "department-e2e-conflict-existing";
const CONFLICT_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-conflict-update-target";
const OUTSIDE_SCOPE_UPDATE_TARGET_DEPARTMENT_SLUG = "department-e2e-outside-scope-update-target";

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
    departmentSlugs: [...API_E2E_TEST_DEPARTMENT_SLUGS],
    emails: [...API_E2E_TEST_EMAILS],
    organizationSlugs: [...API_E2E_TEST_ORGANIZATION_SLUGS],
  });
});

function buildDepartmentPayload({
  name,
  organizationId,
  responsibleName = "Ana Souza",
  responsibleRole = "Secretaria",
  slug,
}: DepartmentPayloadInput) {
  return {
    name,
    responsibleName,
    responsibleRole,
    slug,
    ...(organizationId === undefined ? {} : { organizationId }),
  };
}

describe("department management E2E coverage", () => {
  test("admins can create departments for any organization and persist canonical fields", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Department Admin",
    });
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "91000000000001",
      createdByUserId: admin.user.id,
      name: "Department Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });

    const createResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: buildDepartmentPayload({
        name: "  Department E2E Admin Created  ",
        organizationId: organization.id,
        responsibleName: "  Ana Souza  ",
        responsibleRole: "  Secretaria Municipal  ",
        slug: "  Department E2E Admin Created  ",
      }),
    });
    const createBody = await readJson<DepartmentResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createBody);
    assert.equal(createBody.organizationId, organization.id);
    assert.equal(createBody.slug, ADMIN_CREATED_DEPARTMENT_SLUG);
    assert.equal(createBody.name, "Department E2E Admin Created");
    assert.equal(createBody.responsibleName, "Ana Souza");
    assert.equal(createBody.responsibleRole, "Secretaria Municipal");

    const persistedDepartment = await getDepartmentById(server.app.db, createBody.id);

    assert.ok(persistedDepartment);
    assert.equal(persistedDepartment.organizationId, organization.id);
    assert.equal(persistedDepartment.slug, ADMIN_CREATED_DEPARTMENT_SLUG);
    assert.equal(persistedDepartment.name, "Department E2E Admin Created");
    assert.equal(persistedDepartment.responsibleName, "Ana Souza");
    assert.equal(persistedDepartment.responsibleRole, "Secretaria Municipal");
  });

  test("organization owners create departments only inside their organization and missing scope is rejected", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Department Owner",
      organization: {
        cnpj: "92000000000001",
        name: "Department Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "92000000000002",
      createdByUserId: owner.user.id,
      name: "Department Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const unscopedOwner = await createOrganizationOwnerWithoutOrganizationActor(server, {
      email: UNSCOPED_OWNER_EMAIL,
      name: "Department Owner No Scope",
    });

    const createResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildDepartmentPayload({
        name: "  Department E2E Owner Created  ",
        responsibleName: "  Maria Pessoa  ",
        responsibleRole: "  Diretora  ",
        slug: "  Department E2E Owner Created  ",
      }),
    });
    const createBody = await readJson<DepartmentResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createBody);
    assert.equal(createBody.organizationId, owner.organization.id);
    assert.equal(createBody.slug, OWNER_CREATED_DEPARTMENT_SLUG);

    const outsideScopeCreateResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildDepartmentPayload({
        name: "Department Outside Scope",
        organizationId: otherOrganization.id,
        slug: "department-outside-scope",
      }),
    });

    assert.equal(outsideScopeCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeCreateResponse), {
      error: "forbidden",
      message: "You cannot create departments outside your organization.",
      details: null,
    });

    const noScopeCreateResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: unscopedOwner.cookieJar,
      body: buildDepartmentPayload({
        name: "Department No Scope",
        slug: "department-no-scope",
      }),
    });

    assert.equal(noScopeCreateResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(noScopeCreateResponse), {
      error: "bad_request",
      message: "You do not belong to an organization.",
      details: null,
    });
  });

  test("admins, organization owners, and members receive the expected department listings", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Department Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Department Owner",
      organization: {
        cnpj: "93000000000001",
        name: "Department Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Department Member",
      organizationId: owner.organization.id,
    });
    const unscopedMember = await createMemberActor(server, {
      email: UNSCOPED_MEMBER_EMAIL,
      name: "Department Member No Scope",
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "93000000000002",
      createdByUserId: admin.user.id,
      name: "Department Other Org",
      slug: OTHER_ORG_SLUG,
    });

    await createDepartmentFixture(server.app.db, {
      name: "Department Owner Scope A",
      organizationId: owner.organization.id,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
      slug: OWNER_SCOPE_DEPARTMENT_A_SLUG,
    });
    await createDepartmentFixture(server.app.db, {
      name: "Department Owner Scope B",
      organizationId: owner.organization.id,
      responsibleName: "Bruno Lima",
      responsibleRole: "Diretor",
      slug: OWNER_SCOPE_DEPARTMENT_B_SLUG,
    });
    await createDepartmentFixture(server.app.db, {
      name: "Department Other Org",
      organizationId: otherOrganization.id,
      responsibleName: "Carla Lima",
      responsibleRole: "Secretaria",
      slug: OTHER_ORG_DEPARTMENT_SLUG,
    });

    const adminListResponse = await request(server, "/api/departments/", {
      cookieJar: admin.cookieJar,
    });
    const adminListBody = await readJson<PaginatedDepartmentsResponse>(adminListResponse);

    assert.equal(adminListResponse.status, 200);
    assert.ok(adminListBody);
    assert.equal(adminListBody.page, 1);
    assert.equal(adminListBody.pageSize, 20);
    assert.equal(adminListBody.total, 3);
    assert.equal(adminListBody.totalPages, 1);

    const adminSlugs = new Set(adminListBody.items.map((department) => department.slug));

    assert.equal(adminSlugs.has(OWNER_SCOPE_DEPARTMENT_A_SLUG), true);
    assert.equal(adminSlugs.has(OWNER_SCOPE_DEPARTMENT_B_SLUG), true);
    assert.equal(adminSlugs.has(OTHER_ORG_DEPARTMENT_SLUG), true);

    const ownerListResponse = await request(server, "/api/departments/", {
      cookieJar: owner.cookieJar,
    });
    const ownerListBody = await readJson<PaginatedDepartmentsResponse>(ownerListResponse);

    assert.equal(ownerListResponse.status, 200);
    assert.ok(ownerListBody);
    assert.equal(ownerListBody.total, 2);

    const ownerSlugs = new Set(ownerListBody.items.map((department) => department.slug));

    assert.equal(ownerSlugs.has(OWNER_SCOPE_DEPARTMENT_A_SLUG), true);
    assert.equal(ownerSlugs.has(OWNER_SCOPE_DEPARTMENT_B_SLUG), true);
    assert.equal(ownerSlugs.has(OTHER_ORG_DEPARTMENT_SLUG), false);

    const memberListResponse = await request(server, "/api/departments/", {
      cookieJar: member.cookieJar,
    });
    const memberListBody = await readJson<PaginatedDepartmentsResponse>(memberListResponse);

    assert.equal(memberListResponse.status, 200);
    assert.ok(memberListBody);
    assert.equal(memberListBody.total, 2);

    const memberSlugs = new Set(memberListBody.items.map((department) => department.slug));

    assert.equal(memberSlugs.has(OWNER_SCOPE_DEPARTMENT_A_SLUG), true);
    assert.equal(memberSlugs.has(OWNER_SCOPE_DEPARTMENT_B_SLUG), true);
    assert.equal(memberSlugs.has(OTHER_ORG_DEPARTMENT_SLUG), false);

    const noScopeListResponse = await request(server, "/api/departments/", {
      cookieJar: unscopedMember.cookieJar,
    });
    const noScopeListBody = await readJson<PaginatedDepartmentsResponse>(noScopeListResponse);

    assert.equal(noScopeListResponse.status, 200);
    assert.ok(noScopeListBody);
    assert.deepEqual(noScopeListBody.items, []);
    assert.equal(noScopeListBody.total, 0);
    assert.equal(noScopeListBody.totalPages, 0);
  });

  test("department detail reads are scoped by actor visibility", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Department Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Department Owner",
      organization: {
        cnpj: "94000000000001",
        name: "Department Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Department Member",
      organizationId: owner.organization.id,
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "94000000000002",
      createdByUserId: admin.user.id,
      name: "Department Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const ownerDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Owner Scope A",
      organizationId: owner.organization.id,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
      slug: OWNER_SCOPE_DEPARTMENT_A_SLUG,
    });
    const otherDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Other Org",
      organizationId: otherOrganization.id,
      responsibleName: "Bruno Lima",
      responsibleRole: "Diretor",
      slug: OTHER_ORG_DEPARTMENT_SLUG,
    });

    const adminDetailResponse = await request(server, `/api/departments/${otherDepartment.id}`, {
      cookieJar: admin.cookieJar,
    });
    const adminDetailBody = await readJson<DepartmentResponse>(adminDetailResponse);

    assert.equal(adminDetailResponse.status, 200);
    assert.ok(adminDetailBody);
    assert.equal(adminDetailBody.id, otherDepartment.id);
    assert.equal(adminDetailBody.slug, OTHER_ORG_DEPARTMENT_SLUG);

    const ownerDetailResponse = await request(server, `/api/departments/${ownerDepartment.id}`, {
      cookieJar: owner.cookieJar,
    });
    const ownerDetailBody = await readJson<DepartmentResponse>(ownerDetailResponse);

    assert.equal(ownerDetailResponse.status, 200);
    assert.ok(ownerDetailBody);
    assert.equal(ownerDetailBody.id, ownerDepartment.id);
    assert.equal(ownerDetailBody.organizationId, owner.organization.id);

    const ownerOutsideScopeResponse = await request(
      server,
      `/api/departments/${otherDepartment.id}`,
      {
        cookieJar: owner.cookieJar,
      },
    );

    assert.equal(ownerOutsideScopeResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(ownerOutsideScopeResponse), {
      error: "forbidden",
      message: "You do not have permission to read this department.",
      details: null,
    });

    const memberDetailResponse = await request(server, `/api/departments/${ownerDepartment.id}`, {
      cookieJar: member.cookieJar,
    });

    assert.equal(memberDetailResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberDetailResponse), {
      error: "forbidden",
      message: "You do not have permission to read this department.",
      details: null,
    });
  });

  test("admins and same-organization owners can update departments and persist changes", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Department Admin",
    });
    const adminTargetOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "95000000000001",
      createdByUserId: admin.user.id,
      name: "Department Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });
    const adminTargetDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Admin Update Target",
      organizationId: adminTargetOrganization.id,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
      slug: ADMIN_UPDATE_TARGET_DEPARTMENT_SLUG,
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Department Owner",
      organization: {
        cnpj: "95000000000002",
        name: "Department Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const ownerTargetDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Owner Update Target",
      organizationId: owner.organization.id,
      responsibleName: "Maria Pessoa",
      responsibleRole: "Diretora",
      slug: OWNER_UPDATE_TARGET_DEPARTMENT_SLUG,
    });

    const adminUpdateResponse = await request(
      server,
      `/api/departments/${adminTargetDepartment.id}`,
      {
        method: "PATCH",
        cookieJar: admin.cookieJar,
        body: {
          name: "Department Admin Update Target Updated",
          responsibleRole: "Secretaria Municipal",
          slug: "  Department E2E Admin Update Target Updated  ",
        },
      },
    );
    const adminUpdateBody = await readJson<DepartmentResponse>(adminUpdateResponse);

    assert.equal(adminUpdateResponse.status, 200);
    assert.ok(adminUpdateBody);
    assert.equal(adminUpdateBody.name, "Department Admin Update Target Updated");
    assert.equal(adminUpdateBody.slug, UPDATED_ADMIN_UPDATE_TARGET_DEPARTMENT_SLUG);
    assert.equal(adminUpdateBody.responsibleRole, "Secretaria Municipal");

    const persistedAdminDepartment = await getDepartmentById(
      server.app.db,
      adminTargetDepartment.id,
    );

    assert.ok(persistedAdminDepartment);
    assert.equal(persistedAdminDepartment.name, "Department Admin Update Target Updated");
    assert.equal(persistedAdminDepartment.slug, UPDATED_ADMIN_UPDATE_TARGET_DEPARTMENT_SLUG);
    assert.equal(persistedAdminDepartment.responsibleRole, "Secretaria Municipal");

    const ownerUpdateResponse = await request(
      server,
      `/api/departments/${ownerTargetDepartment.id}`,
      {
        method: "PATCH",
        cookieJar: owner.cookieJar,
        body: {
          name: "Department Owner Update Target Updated",
          responsibleName: "Joana Lima",
          slug: "  Department E2E Owner Update Target Updated  ",
        },
      },
    );
    const ownerUpdateBody = await readJson<DepartmentResponse>(ownerUpdateResponse);

    assert.equal(ownerUpdateResponse.status, 200);
    assert.ok(ownerUpdateBody);
    assert.equal(ownerUpdateBody.name, "Department Owner Update Target Updated");
    assert.equal(ownerUpdateBody.slug, UPDATED_OWNER_UPDATE_TARGET_DEPARTMENT_SLUG);
    assert.equal(ownerUpdateBody.responsibleName, "Joana Lima");

    const persistedOwnerDepartment = await getDepartmentById(
      server.app.db,
      ownerTargetDepartment.id,
    );

    assert.ok(persistedOwnerDepartment);
    assert.equal(persistedOwnerDepartment.name, "Department Owner Update Target Updated");
    assert.equal(persistedOwnerDepartment.slug, UPDATED_OWNER_UPDATE_TARGET_DEPARTMENT_SLUG);
    assert.equal(persistedOwnerDepartment.responsibleName, "Joana Lima");
  });

  test("department management rejects unauthorized writes, out-of-scope updates, and same-organization slug conflicts", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Department Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Department Owner",
      organization: {
        cnpj: "96000000000001",
        name: "Department Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Department Member",
      organizationId: owner.organization.id,
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "96000000000002",
      createdByUserId: admin.user.id,
      name: "Department Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const existingDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Conflict Existing",
      organizationId: owner.organization.id,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
      slug: CONFLICT_EXISTING_DEPARTMENT_SLUG,
    });
    const updateTargetDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Conflict Update Target",
      organizationId: owner.organization.id,
      responsibleName: "Bruno Lima",
      responsibleRole: "Diretor",
      slug: CONFLICT_UPDATE_TARGET_DEPARTMENT_SLUG,
    });
    const outsideScopeDepartment = await createDepartmentFixture(server.app.db, {
      name: "Department Outside Scope Update Target",
      organizationId: otherOrganization.id,
      responsibleName: "Carla Lima",
      responsibleRole: "Secretaria",
      slug: OUTSIDE_SCOPE_UPDATE_TARGET_DEPARTMENT_SLUG,
    });

    const anonymousCreateResponse = await request(server, "/api/departments/", {
      method: "POST",
      body: buildDepartmentPayload({
        name: "Anonymous Department",
        organizationId: owner.organization.id,
        slug: "anonymous-department",
      }),
    });
    const memberCreateResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: buildDepartmentPayload({
        name: "Member Department",
        organizationId: owner.organization.id,
        slug: "member-department",
      }),
    });
    const anonymousUpdateResponse = await request(
      server,
      `/api/departments/${existingDepartment.id}`,
      {
        method: "PATCH",
        body: {
          name: "Should Not Work",
        },
      },
    );
    const memberUpdateResponse = await request(
      server,
      `/api/departments/${existingDepartment.id}`,
      {
        method: "PATCH",
        cookieJar: member.cookieJar,
        body: {
          name: "Still Should Not Work",
        },
      },
    );
    const outsideScopeUpdateResponse = await request(
      server,
      `/api/departments/${outsideScopeDepartment.id}`,
      {
        method: "PATCH",
        cookieJar: owner.cookieJar,
        body: {
          name: "Should Fail",
        },
      },
    );
    const createConflictResponse = await request(server, "/api/departments/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: buildDepartmentPayload({
        name: "Department Conflict Existing Duplicate",
        organizationId: owner.organization.id,
        responsibleName: "Daniela Lima",
        responsibleRole: "Secretaria",
        slug: CONFLICT_EXISTING_DEPARTMENT_SLUG,
      }),
    });
    const updateConflictResponse = await request(
      server,
      `/api/departments/${updateTargetDepartment.id}`,
      {
        method: "PATCH",
        cookieJar: admin.cookieJar,
        body: {
          slug: CONFLICT_EXISTING_DEPARTMENT_SLUG,
        },
      },
    );

    for (const response of [anonymousCreateResponse, anonymousUpdateResponse]) {
      assert.equal(response.status, 401);
      assert.deepEqual(await readJson<ErrorResponse>(response), {
        error: "unauthorized",
        message: "Authentication required.",
        details: null,
      });
    }

    assert.equal(memberCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberCreateResponse), {
      error: "forbidden",
      message: "You do not have permission to create departments.",
      details: null,
    });

    assert.equal(memberUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to update this department.",
      details: null,
    });

    assert.equal(outsideScopeUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to update this department.",
      details: null,
    });

    assert.deepEqual(
      [createConflictResponse.status, await readJson<ErrorResponse>(createConflictResponse)],
      [
        409,
        {
          error: "conflict",
          message: "Department slug is already in use for this organization.",
          details: null,
        },
      ],
    );

    assert.deepEqual(
      [updateConflictResponse.status, await readJson<ErrorResponse>(updateConflictResponse)],
      [
        409,
        {
          error: "conflict",
          message: "Department slug is already in use for this organization.",
          details: null,
        },
      ],
    );

    const persistedOutsideScopeDepartment = await getDepartmentById(
      server.app.db,
      outsideScopeDepartment.id,
    );
    const persistedUpdateTargetDepartment = await getDepartmentById(
      server.app.db,
      updateTargetDepartment.id,
    );

    assert.ok(persistedOutsideScopeDepartment);
    assert.equal(persistedOutsideScopeDepartment.name, "Department Outside Scope Update Target");
    assert.ok(persistedUpdateTargetDepartment);
    assert.equal(persistedUpdateTargetDepartment.slug, CONFLICT_UPDATE_TARGET_DEPARTMENT_SLUG);
    assert.ok(await getDepartmentBySlug(server.app.db, CONFLICT_EXISTING_DEPARTMENT_SLUG));
  });
});
