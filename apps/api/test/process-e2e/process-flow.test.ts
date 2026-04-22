import assert from "node:assert/strict";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
import {
  createAdminActor,
  createMemberActor,
  createOrganizationOwnerActor,
} from "../e2e/helpers/actors";
import {
  cleanupApiE2EState,
  createDepartmentFixture,
  createDocumentFixture,
  createOrganizationFixture,
  createProcessFixture,
  getDocumentById,
  getProcessById,
  getProcessDepartmentIds,
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

type ErrorResponse = {
  details: unknown;
  error: string;
  message: string;
};

type PaginatedProcessesResponse = {
  items: ProcessResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ProcessPayloadInput = {
  departmentIds?: string[];
  externalId?: string | null;
  issuedAt?: string;
  justification?: string;
  object?: string;
  organizationId?: string;
  processNumber?: string;
  responsibleName?: string;
  status?: string;
  type?: string;
};

type ProcessResponse = {
  createdAt: string;
  departmentIds: string[];
  externalId: string | null;
  id: string;
  issuedAt: string;
  justification: string;
  object: string;
  organizationId: string;
  processNumber: string;
  responsibleName: string;
  sourceKind: string | null;
  sourceMetadata: Record<string, unknown> | null;
  sourceReference: string | null;
  status: string;
  type: string;
  updatedAt: string;
};

const ADMIN_EMAIL = "process-e2e-admin@licitadoc.test";
const OWNER_EMAIL = "process-e2e-owner@licitadoc.test";
const MEMBER_EMAIL = "process-e2e-member@licitadoc.test";
const UNSCOPED_MEMBER_EMAIL = "process-e2e-member-no-scope@licitadoc.test";

const OWNER_ORG_SLUG = "process-e2e-owner-org";
const OTHER_ORG_SLUG = "process-e2e-other-org";
const ADMIN_TARGET_ORG_SLUG = "process-e2e-admin-target-org";

const OWNER_DEPARTMENT_A_SLUG = "process-e2e-owner-dept-a";
const OWNER_DEPARTMENT_B_SLUG = "process-e2e-owner-dept-b";
const OTHER_ORG_DEPARTMENT_SLUG = "process-e2e-other-org-dept";
const ADMIN_TARGET_DEPARTMENT_A_SLUG = "process-e2e-admin-target-dept-a";
const ADMIN_TARGET_DEPARTMENT_B_SLUG = "process-e2e-admin-target-dept-b";
const MEMBER_UPDATE_DEPARTMENT_CURRENT_SLUG = "process-e2e-member-update-dept-current";
const MEMBER_UPDATE_DEPARTMENT_NEXT_SLUG = "process-e2e-member-update-dept-next";
const OWNER_DOCUMENT_DEPARTMENT_CURRENT_SLUG = "process-e2e-owner-doc-dept-current";
const OWNER_DOCUMENT_DEPARTMENT_NEXT_SLUG = "process-e2e-owner-doc-dept-next";
const CONFLICT_EXISTING_DEPARTMENT_SLUG = "process-e2e-conflict-existing-dept";
const CONFLICT_UPDATE_TARGET_DEPARTMENT_SLUG = "process-e2e-conflict-update-target-dept";
const FOREIGN_UPDATE_DEPARTMENT_SLUG = "process-e2e-foreign-update-dept";
const EXPENSE_REQUEST_TEXT = `
PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000
CNPJ: 08.290.223/0001-42
Solicitacao de
Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentaria: 06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
N Solicitacao:
6
Data Emissao:
08/01/2026 10/2026
Processo:
Servico
Classificacao:
Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI para abrilhantar as festividades do Carnaval de Pureza 2026.
Objeto:
O Municipio de Pureza/RN realizara o Carnaval de Pureza 2026, evento tradicional que integra o calendario oficial de festividades do municipio.
Justificativa:
Item Descricao Qtd. Und Vlr. Unitario Vlr. TotalLote FatorQtd.Ini
apresentacao artistica musical da banda FORRO TSUNAMI para abrilhantar as festividades do Carnaval de Pureza 2026, com duracao de 02 horas de show.
0005091  1  0,00  0,00SERVICO
0,00Valor Total:
SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER
MARIA MARILDA SILVA DA ROCHA
878.541.554-53
`;

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

function buildProcessPayload({
  departmentIds = [],
  externalId = null,
  issuedAt = "2026-01-08",
  justification = "Justificativa de teste",
  object = "Objeto do processo de teste",
  organizationId,
  processNumber = "PROC-2026-001",
  responsibleName = "Ana Souza",
  status = "draft",
  type = "pregao",
}: ProcessPayloadInput) {
  return {
    type,
    processNumber,
    externalId,
    issuedAt,
    object,
    justification,
    responsibleName,
    status,
    departmentIds,
    ...(organizationId === undefined ? {} : { organizationId }),
  };
}

describe("process management E2E coverage", () => {
  test("admins can create processes for any organization and persist department links", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Process Admin",
    });
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "94100000000001",
      createdByUserId: admin.user.id,
      name: "Process Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });
    const departmentA = await createDepartmentFixture(server.app.db, {
      name: "Process Admin Target Dept A",
      organizationId: organization.id,
      slug: ADMIN_TARGET_DEPARTMENT_A_SLUG,
    });
    const departmentB = await createDepartmentFixture(server.app.db, {
      name: "Process Admin Target Dept B",
      organizationId: organization.id,
      slug: ADMIN_TARGET_DEPARTMENT_B_SLUG,
    });

    const createResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: buildProcessPayload({
        type: "  inexigibilidade  ",
        processNumber: "  PROC-ADMIN-001  ",
        externalId: "  EXT-ADMIN-001  ",
        issuedAt: "2026-03-05",
        object: "  Contratacao de servico tecnico especializado  ",
        justification: "  Necessidade de suporte continuo  ",
        responsibleName: "  Carla Lima  ",
        organizationId: organization.id,
        departmentIds: [departmentA.id, departmentB.id],
      }),
    });
    const createBody = await readJson<ProcessResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createBody);
    assert.equal(createBody.organizationId, organization.id);
    assert.equal(createBody.type, "inexigibilidade");
    assert.equal(createBody.processNumber, "PROC-ADMIN-001");
    assert.equal(createBody.externalId, "EXT-ADMIN-001");
    assert.equal(createBody.object, "Contratacao de servico tecnico especializado");
    assert.equal(createBody.justification, "Necessidade de suporte continuo");
    assert.equal(createBody.responsibleName, "Carla Lima");
    assert.deepEqual(createBody.departmentIds, [departmentA.id, departmentB.id]);

    const persistedProcess = await getProcessById(server.app.db, createBody.id);
    const persistedDepartmentIds = await getProcessDepartmentIds(server.app.db, createBody.id);

    assert.ok(persistedProcess);
    assert.equal(persistedProcess.organizationId, organization.id);
    assert.equal(persistedProcess.processNumber, "PROC-ADMIN-001");
    assert.equal(persistedProcess.externalId, "EXT-ADMIN-001");
    assert.equal(
      persistedProcess.issuedAt.toISOString(),
      new Date("2026-03-05T00:00:00.000Z").toISOString(),
    );
    assert.equal(persistedProcess.object, "Contratacao de servico tecnico especializado");
    assert.equal(persistedProcess.justification, "Necessidade de suporte continuo");
    assert.equal(persistedProcess.responsibleName, "Carla Lima");
    assert.deepEqual(persistedDepartmentIds, [departmentA.id, departmentB.id].sort());
  });

  test("organization owners and members create processes only inside their scope and reject foreign organization or departments", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "94200000000001",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Process Member",
      organizationId: owner.organization.id,
    });
    const unscopedMember = await createMemberActor(server, {
      email: UNSCOPED_MEMBER_EMAIL,
      name: "Process Member No Scope",
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "94200000000002",
      createdByUserId: owner.user.id,
      name: "Process Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const ownerDepartmentA = await createDepartmentFixture(server.app.db, {
      name: "Process Owner Dept A",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_A_SLUG,
    });
    const ownerDepartmentB = await createDepartmentFixture(server.app.db, {
      name: "Process Owner Dept B",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_B_SLUG,
    });
    const otherDepartment = await createDepartmentFixture(server.app.db, {
      name: "Process Other Org Dept",
      organizationId: otherOrganization.id,
      slug: OTHER_ORG_DEPARTMENT_SLUG,
    });

    const ownerCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-OWNER-001",
        departmentIds: [ownerDepartmentA.id],
      }),
    });
    const ownerCreateBody = await readJson<ProcessResponse>(ownerCreateResponse);

    assert.equal(ownerCreateResponse.status, 201);
    assert.ok(ownerCreateBody);
    assert.equal(ownerCreateBody.organizationId, owner.organization.id);
    assert.deepEqual(ownerCreateBody.departmentIds, [ownerDepartmentA.id]);

    const memberCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-MEMBER-001",
        departmentIds: [ownerDepartmentB.id],
      }),
    });
    const memberCreateBody = await readJson<ProcessResponse>(memberCreateResponse);

    assert.equal(memberCreateResponse.status, 201);
    assert.ok(memberCreateBody);
    assert.equal(memberCreateBody.organizationId, owner.organization.id);
    assert.deepEqual(memberCreateBody.departmentIds, [ownerDepartmentB.id]);

    const outsideScopeCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-OWNER-OUTSIDE",
        organizationId: otherOrganization.id,
        departmentIds: [otherDepartment.id],
      }),
    });

    assert.equal(outsideScopeCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeCreateResponse), {
      error: "forbidden",
      message: "You cannot create processes outside your organization.",
      details: null,
    });

    const foreignDepartmentCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-MEMBER-FOREIGN-DEPT",
        departmentIds: [otherDepartment.id],
      }),
    });

    assert.equal(foreignDepartmentCreateResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(foreignDepartmentCreateResponse), {
      error: "bad_request",
      message: "Departments must belong to the same organization as the process.",
      details: null,
    });

    const noScopeCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: unscopedMember.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-MEMBER-NO-SCOPE",
        departmentIds: [ownerDepartmentA.id],
      }),
    });

    assert.equal(noScopeCreateResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(noScopeCreateResponse), {
      error: "bad_request",
      message: "You do not belong to an organization.",
      details: null,
    });
  });

  test("members and admins create processes from expense request text with scoped department links", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "08.290.223/0001-42",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Process Member",
      organizationId: owner.organization.id,
    });
    const department = await createDepartmentFixture(server.app.db, {
      budgetUnitCode: "06.001",
      name: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_A_SLUG,
    });

    const memberCreateResponse = await request(server, "/api/processes/from-expense-request", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: {
        expenseRequestText: EXPENSE_REQUEST_TEXT,
        sourceLabel: "SD.pdf",
      },
    });
    const memberCreateBody = await readJson<ProcessResponse>(memberCreateResponse);

    assert.equal(memberCreateResponse.status, 201);
    assert.ok(memberCreateBody);
    assert.equal(memberCreateBody.organizationId, owner.organization.id);
    assert.equal(memberCreateBody.processNumber, "SD-6-2026");
    assert.equal(memberCreateBody.externalId, "6");
    assert.equal(memberCreateBody.type, "Servico");
    assert.equal(memberCreateBody.sourceKind, "expense_request");
    assert.equal(memberCreateBody.sourceReference, "SD-6-2026");
    assert.deepEqual(memberCreateBody.departmentIds, [department.id]);
    assert.equal(
      JSON.stringify(memberCreateBody.sourceMetadata).includes("expenseRequestText"),
      false,
    );

    const persistedProcess = await getProcessById(server.app.db, memberCreateBody.id);
    const persistedDepartmentIds = await getProcessDepartmentIds(
      server.app.db,
      memberCreateBody.id,
    );

    assert.ok(persistedProcess);
    assert.equal(persistedProcess.sourceKind, "expense_request");
    assert.deepEqual(persistedDepartmentIds, [department.id]);

    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Process Admin",
    });
    const adminOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "08.290.223/0001-43",
      createdByUserId: admin.user.id,
      name: "Process Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });
    await createDepartmentFixture(server.app.db, {
      budgetUnitCode: "06.001",
      name: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
      organizationId: adminOrganization.id,
      slug: ADMIN_TARGET_DEPARTMENT_A_SLUG,
    });

    const adminCreateResponse = await request(server, "/api/processes/from-expense-request", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        expenseRequestText: EXPENSE_REQUEST_TEXT.replace(
          "CNPJ: 08.290.223/0001-42",
          "CNPJ: 08.290.223/0001-43",
        ).replace("N Solicitacao:\n6", "N Solicitacao:\n7"),
      },
    });
    const adminCreateBody = await readJson<ProcessResponse>(adminCreateResponse);

    assert.equal(adminCreateResponse.status, 201);
    assert.ok(adminCreateBody);
    assert.equal(adminCreateBody.organizationId, adminOrganization.id);
    assert.equal(adminCreateBody.processNumber, "SD-7-2026");
  });

  test("admins, owners, and members receive scoped process listings and reads", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Process Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "94300000000001",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Process Member",
      organizationId: owner.organization.id,
    });
    const unscopedMember = await createMemberActor(server, {
      email: UNSCOPED_MEMBER_EMAIL,
      name: "Process Member No Scope",
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "94300000000002",
      createdByUserId: admin.user.id,
      name: "Process Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const ownerDepartmentA = await createDepartmentFixture(server.app.db, {
      name: "Process Owner Dept A",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_A_SLUG,
    });
    const ownerDepartmentB = await createDepartmentFixture(server.app.db, {
      name: "Process Owner Dept B",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_B_SLUG,
    });
    const otherDepartment = await createDepartmentFixture(server.app.db, {
      name: "Process Other Org Dept",
      organizationId: otherOrganization.id,
      slug: OTHER_ORG_DEPARTMENT_SLUG,
    });
    const ownerProcess = await createProcessFixture(server.app.db, {
      organizationId: owner.organization.id,
      processNumber: "PROC-SCOPE-001",
      object: "Owner Scoped Process",
      departmentIds: [ownerDepartmentA.id, ownerDepartmentB.id],
    });
    const otherProcess = await createProcessFixture(server.app.db, {
      organizationId: otherOrganization.id,
      processNumber: "PROC-SCOPE-OTHER-001",
      object: "Other Org Process",
      departmentIds: [otherDepartment.id],
    });

    const adminListResponse = await request(server, "/api/processes/?page=1&pageSize=20", {
      cookieJar: admin.cookieJar,
    });
    const adminListBody = await readJson<PaginatedProcessesResponse>(adminListResponse);

    assert.equal(adminListResponse.status, 200);
    assert.ok(adminListBody);
    assert.equal(adminListBody.total, 2);
    assert.deepEqual(
      adminListBody.items.map((item) => item.id).sort(),
      [ownerProcess.id, otherProcess.id].sort(),
    );

    const ownerListResponse = await request(server, "/api/processes/?page=1&pageSize=20", {
      cookieJar: owner.cookieJar,
    });
    const ownerListBody = await readJson<PaginatedProcessesResponse>(ownerListResponse);

    assert.equal(ownerListResponse.status, 200);
    assert.ok(ownerListBody);
    assert.equal(ownerListBody.total, 1);
    assert.deepEqual(
      ownerListBody.items.map((item) => item.id),
      [ownerProcess.id],
    );
    assert.deepEqual(ownerListBody.items[0]?.departmentIds, [
      ...[ownerDepartmentA.id, ownerDepartmentB.id].sort(),
    ]);

    const memberListResponse = await request(server, "/api/processes/?page=1&pageSize=20", {
      cookieJar: member.cookieJar,
    });
    const memberListBody = await readJson<PaginatedProcessesResponse>(memberListResponse);

    assert.equal(memberListResponse.status, 200);
    assert.ok(memberListBody);
    assert.equal(memberListBody.total, 1);
    assert.deepEqual(
      memberListBody.items.map((item) => item.id),
      [ownerProcess.id],
    );

    const noScopeListResponse = await request(server, "/api/processes/?page=1&pageSize=20", {
      cookieJar: unscopedMember.cookieJar,
    });
    const noScopeListBody = await readJson<PaginatedProcessesResponse>(noScopeListResponse);

    assert.equal(noScopeListResponse.status, 200);
    assert.deepEqual(noScopeListBody, {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });

    const adminReadResponse = await request(server, `/api/processes/${otherProcess.id}`, {
      cookieJar: admin.cookieJar,
    });
    const adminReadBody = await readJson<ProcessResponse>(adminReadResponse);

    assert.equal(adminReadResponse.status, 200);
    assert.ok(adminReadBody);
    assert.equal(adminReadBody.id, otherProcess.id);

    const ownerReadResponse = await request(server, `/api/processes/${ownerProcess.id}`, {
      cookieJar: owner.cookieJar,
    });
    const ownerReadBody = await readJson<ProcessResponse>(ownerReadResponse);

    assert.equal(ownerReadResponse.status, 200);
    assert.ok(ownerReadBody);
    assert.equal(ownerReadBody.id, ownerProcess.id);
    assert.deepEqual(ownerReadBody.departmentIds, [
      ...[ownerDepartmentA.id, ownerDepartmentB.id].sort(),
    ]);

    const memberReadResponse = await request(server, `/api/processes/${ownerProcess.id}`, {
      cookieJar: member.cookieJar,
    });
    const memberReadBody = await readJson<ProcessResponse>(memberReadResponse);

    assert.equal(memberReadResponse.status, 200);
    assert.ok(memberReadBody);
    assert.equal(memberReadBody.id, ownerProcess.id);
  });

  test("admins and scoped members update processes and resynchronize department ids", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Process Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "94400000000001",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Process Member",
      organizationId: owner.organization.id,
    });
    const adminTargetOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "94400000000002",
      createdByUserId: admin.user.id,
      name: "Process Admin Target Org",
      slug: ADMIN_TARGET_ORG_SLUG,
    });
    const adminTargetDepartmentA = await createDepartmentFixture(server.app.db, {
      name: "Admin Target Dept A",
      organizationId: adminTargetOrganization.id,
      slug: ADMIN_TARGET_DEPARTMENT_A_SLUG,
    });
    const adminTargetDepartmentB = await createDepartmentFixture(server.app.db, {
      name: "Admin Target Dept B",
      organizationId: adminTargetOrganization.id,
      slug: ADMIN_TARGET_DEPARTMENT_B_SLUG,
    });
    const memberCurrentDepartment = await createDepartmentFixture(server.app.db, {
      name: "Member Update Current Dept",
      organizationId: owner.organization.id,
      slug: MEMBER_UPDATE_DEPARTMENT_CURRENT_SLUG,
    });
    const memberNextDepartment = await createDepartmentFixture(server.app.db, {
      name: "Member Update Next Dept",
      organizationId: owner.organization.id,
      slug: MEMBER_UPDATE_DEPARTMENT_NEXT_SLUG,
    });
    const adminTargetProcess = await createProcessFixture(server.app.db, {
      organizationId: adminTargetOrganization.id,
      processNumber: "PROC-ADMIN-UPDATE-001",
      externalId: "EXT-ADMIN-BEFORE",
      departmentIds: [adminTargetDepartmentA.id],
    });
    const memberOwnedProcess = await createProcessFixture(server.app.db, {
      organizationId: owner.organization.id,
      processNumber: "PROC-MEMBER-UPDATE-001",
      externalId: "EXT-MEMBER-BEFORE",
      departmentIds: [memberCurrentDepartment.id],
    });

    const adminUpdateResponse = await request(server, `/api/processes/${adminTargetProcess.id}`, {
      method: "PATCH",
      cookieJar: admin.cookieJar,
      body: buildProcessPayload({
        type: "concorrencia",
        processNumber: "PROC-ADMIN-UPDATE-002",
        externalId: "EXT-ADMIN-AFTER",
        issuedAt: "2026-05-12",
        object: "Objeto atualizado por admin",
        justification: "Justificativa atualizada por admin",
        responsibleName: "Juliana Castro",
        status: "published",
        departmentIds: [adminTargetDepartmentB.id],
      }),
    });
    const adminUpdateBody = await readJson<ProcessResponse>(adminUpdateResponse);

    assert.equal(adminUpdateResponse.status, 200);
    assert.ok(adminUpdateBody);
    assert.equal(adminUpdateBody.processNumber, "PROC-ADMIN-UPDATE-002");
    assert.deepEqual(adminUpdateBody.departmentIds, [adminTargetDepartmentB.id]);

    const persistedAdminProcess = await getProcessById(server.app.db, adminTargetProcess.id);
    const persistedAdminDepartmentIds = await getProcessDepartmentIds(
      server.app.db,
      adminTargetProcess.id,
    );

    assert.ok(persistedAdminProcess);
    assert.equal(persistedAdminProcess.type, "concorrencia");
    assert.equal(persistedAdminProcess.processNumber, "PROC-ADMIN-UPDATE-002");
    assert.equal(persistedAdminProcess.externalId, "EXT-ADMIN-AFTER");
    assert.equal(
      persistedAdminProcess.issuedAt.toISOString(),
      new Date("2026-05-12T00:00:00.000Z").toISOString(),
    );
    assert.equal(persistedAdminProcess.object, "Objeto atualizado por admin");
    assert.equal(persistedAdminProcess.justification, "Justificativa atualizada por admin");
    assert.equal(persistedAdminProcess.responsibleName, "Juliana Castro");
    assert.equal(persistedAdminProcess.status, "published");
    assert.deepEqual(persistedAdminDepartmentIds, [adminTargetDepartmentB.id]);

    const memberUpdateResponse = await request(server, `/api/processes/${memberOwnedProcess.id}`, {
      method: "PATCH",
      cookieJar: member.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-MEMBER-UPDATE-002",
        externalId: null,
        object: "Objeto atualizado por member",
        justification: "Justificativa atualizada por member",
        responsibleName: "Rafael Nunes",
        status: "review",
        departmentIds: [memberNextDepartment.id],
      }),
    });
    const memberUpdateBody = await readJson<ProcessResponse>(memberUpdateResponse);

    assert.equal(memberUpdateResponse.status, 200);
    assert.ok(memberUpdateBody);
    assert.equal(memberUpdateBody.processNumber, "PROC-MEMBER-UPDATE-002");
    assert.equal(memberUpdateBody.externalId, null);
    assert.deepEqual(memberUpdateBody.departmentIds, [memberNextDepartment.id]);

    const persistedMemberProcess = await getProcessById(server.app.db, memberOwnedProcess.id);
    const persistedMemberDepartmentIds = await getProcessDepartmentIds(
      server.app.db,
      memberOwnedProcess.id,
    );

    assert.ok(persistedMemberProcess);
    assert.equal(persistedMemberProcess.processNumber, "PROC-MEMBER-UPDATE-002");
    assert.equal(persistedMemberProcess.externalId, null);
    assert.equal(persistedMemberProcess.object, "Objeto atualizado por member");
    assert.equal(persistedMemberProcess.justification, "Justificativa atualizada por member");
    assert.equal(persistedMemberProcess.responsibleName, "Rafael Nunes");
    assert.equal(persistedMemberProcess.status, "review");
    assert.deepEqual(persistedMemberDepartmentIds, [memberNextDepartment.id]);
  });

  test("process updates preserve linked document ownership", async () => {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "94500000000001",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const currentDepartment = await createDepartmentFixture(server.app.db, {
      name: "Owner Document Current Dept",
      organizationId: owner.organization.id,
      slug: OWNER_DOCUMENT_DEPARTMENT_CURRENT_SLUG,
    });
    const nextDepartment = await createDepartmentFixture(server.app.db, {
      name: "Owner Document Next Dept",
      organizationId: owner.organization.id,
      slug: OWNER_DOCUMENT_DEPARTMENT_NEXT_SLUG,
    });
    const process = await createProcessFixture(server.app.db, {
      organizationId: owner.organization.id,
      processNumber: "PROC-DOCUMENT-001",
      departmentIds: [currentDepartment.id],
    });
    const document = await createDocumentFixture(server.app.db, {
      organizationId: owner.organization.id,
      processId: process.id,
      name: "Documento do Processo",
      storageKey: "documents/process-e2e/documento.pdf",
      responsibles: ["Ana Souza"],
    });

    const updateResponse = await request(server, `/api/processes/${process.id}`, {
      method: "PATCH",
      cookieJar: owner.cookieJar,
      body: buildProcessPayload({
        processNumber: "PROC-DOCUMENT-002",
        object: "Objeto atualizado com documento vinculado",
        departmentIds: [nextDepartment.id],
      }),
    });
    const updateBody = await readJson<ProcessResponse>(updateResponse);

    assert.equal(updateResponse.status, 200);
    assert.ok(updateBody);
    assert.equal(updateBody.processNumber, "PROC-DOCUMENT-002");
    assert.deepEqual(updateBody.departmentIds, [nextDepartment.id]);

    const persistedDocument = await getDocumentById(server.app.db, document.id);
    const persistedDepartmentIds = await getProcessDepartmentIds(server.app.db, process.id);

    assert.ok(persistedDocument);
    assert.equal(persistedDocument.processId, process.id);
    assert.equal(persistedDocument.organizationId, owner.organization.id);
    assert.deepEqual(persistedDepartmentIds, [nextDepartment.id]);
  });

  test("negative scenarios reject unauthenticated, out-of-scope, foreign department, and conflicting process changes", async () => {
    const admin = await createAdminActor(server, {
      email: ADMIN_EMAIL,
      name: "Process Admin",
    });
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Process Owner",
      organization: {
        cnpj: "94600000000001",
        name: "Process Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const member = await createMemberActor(server, {
      email: MEMBER_EMAIL,
      name: "Process Member",
      organizationId: owner.organization.id,
    });
    const otherOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "94600000000002",
      createdByUserId: admin.user.id,
      name: "Process Other Org",
      slug: OTHER_ORG_SLUG,
    });
    const ownerDepartment = await createDepartmentFixture(server.app.db, {
      name: "Conflict Existing Dept",
      organizationId: owner.organization.id,
      slug: CONFLICT_EXISTING_DEPARTMENT_SLUG,
    });
    const conflictUpdateDepartment = await createDepartmentFixture(server.app.db, {
      name: "Conflict Update Target Dept",
      organizationId: owner.organization.id,
      slug: CONFLICT_UPDATE_TARGET_DEPARTMENT_SLUG,
    });
    const foreignDepartment = await createDepartmentFixture(server.app.db, {
      name: "Foreign Update Dept",
      organizationId: otherOrganization.id,
      slug: FOREIGN_UPDATE_DEPARTMENT_SLUG,
    });
    const existingProcess = await createProcessFixture(server.app.db, {
      organizationId: owner.organization.id,
      processNumber: "PROC-CONFLICT-001",
      departmentIds: [ownerDepartment.id],
    });
    const updateTargetProcess = await createProcessFixture(server.app.db, {
      organizationId: owner.organization.id,
      processNumber: "PROC-CONFLICT-002",
      departmentIds: [conflictUpdateDepartment.id],
    });
    const outsideScopeProcess = await createProcessFixture(server.app.db, {
      organizationId: otherOrganization.id,
      processNumber: "PROC-OUTSIDE-001",
      departmentIds: [foreignDepartment.id],
    });

    const unauthenticatedCreateResponse = await request(server, "/api/processes/", {
      method: "POST",
      body: buildProcessPayload({
        organizationId: owner.organization.id,
        processNumber: "PROC-UNAUTH-001",
        departmentIds: [ownerDepartment.id],
      }),
    });
    assert.equal(unauthenticatedCreateResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(unauthenticatedCreateResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const unauthenticatedListResponse = await request(server, "/api/processes/");
    assert.equal(unauthenticatedListResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(unauthenticatedListResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const unauthenticatedReadResponse = await request(
      server,
      `/api/processes/${existingProcess.id}`,
    );
    assert.equal(unauthenticatedReadResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(unauthenticatedReadResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const unauthenticatedUpdateResponse = await request(
      server,
      `/api/processes/${existingProcess.id}`,
      {
        method: "PATCH",
        body: buildProcessPayload({
          processNumber: "PROC-UNAUTH-UPDATE-001",
          departmentIds: [ownerDepartment.id],
        }),
      },
    );
    assert.equal(unauthenticatedUpdateResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(unauthenticatedUpdateResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const outsideScopeReadResponse = await request(
      server,
      `/api/processes/${outsideScopeProcess.id}`,
      {
        cookieJar: member.cookieJar,
      },
    );
    assert.equal(outsideScopeReadResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeReadResponse), {
      error: "forbidden",
      message: "You do not have permission to read this process.",
      details: null,
    });

    const outsideScopeUpdateResponse = await request(
      server,
      `/api/processes/${outsideScopeProcess.id}`,
      {
        method: "PATCH",
        cookieJar: member.cookieJar,
        body: buildProcessPayload({
          processNumber: "PROC-OUTSIDE-UPDATE-002",
          departmentIds: [foreignDepartment.id],
        }),
      },
    );
    assert.equal(outsideScopeUpdateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(outsideScopeUpdateResponse), {
      error: "forbidden",
      message: "You do not have permission to update this process.",
      details: null,
    });

    const foreignDepartmentUpdateResponse = await request(
      server,
      `/api/processes/${updateTargetProcess.id}`,
      {
        method: "PATCH",
        cookieJar: member.cookieJar,
        body: buildProcessPayload({
          processNumber: "PROC-FOREIGN-DEPT-UPDATE-001",
          departmentIds: [foreignDepartment.id],
        }),
      },
    );
    assert.equal(foreignDepartmentUpdateResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(foreignDepartmentUpdateResponse), {
      error: "bad_request",
      message: "Departments must belong to the same organization as the process.",
      details: null,
    });

    const createConflictResponse = await request(server, "/api/processes/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: buildProcessPayload({
        processNumber: existingProcess.processNumber,
        departmentIds: [ownerDepartment.id],
      }),
    });
    assert.equal(createConflictResponse.status, 409);
    assert.deepEqual(await readJson<ErrorResponse>(createConflictResponse), {
      error: "conflict",
      message: "Process number is already in use for this organization.",
      details: null,
    });

    const updateConflictResponse = await request(
      server,
      `/api/processes/${updateTargetProcess.id}`,
      {
        method: "PATCH",
        cookieJar: member.cookieJar,
        body: buildProcessPayload({
          processNumber: existingProcess.processNumber,
          departmentIds: [conflictUpdateDepartment.id],
        }),
      },
    );
    assert.equal(updateConflictResponse.status, 409);
    assert.deepEqual(await readJson<ErrorResponse>(updateConflictResponse), {
      error: "conflict",
      message: "Process number is already in use for this organization.",
      details: null,
    });
  });
});
