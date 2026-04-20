import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyInstance } from "fastify";
import {
  departments,
  type documents,
  type organizations,
  processDepartments,
  processes,
} from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { createProcess } from "./create-process";
import { getProcess } from "./get-process";
import { getProcesses } from "./get-processes";
import { createProcessBodySchema, updateProcessBodySchema } from "./processes.schemas";
import { updateProcess } from "./update-process";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";
const SECOND_DEPARTMENT_ID = "8f8f8f8f-e2e5-4876-b4c3-b35306c6e733";
const DOCUMENT_ID = "7a7a7a7a-e2e5-4876-b4c3-b35306c6e733";

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: ORGANIZATION_ID,
    name: "Prefeitura de Exemplo",
    slug: "prefeitura-de-exemplo",
    officialName: "Prefeitura Municipal de Exemplo",
    cnpj: "12.345.678/0001-99",
    city: "Exemplo",
    state: "CE",
    address: "Rua Principal, 100",
    zipCode: "60000-000",
    phone: "(85) 3333-0000",
    institutionalEmail: "contato@exemplo.ce.gov.br",
    website: null,
    logoUrl: null,
    authorityName: "Maria Silva",
    authorityRole: "Prefeita",
    isActive: true,
    createdByUserId: "admin_user",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createProcessRow(
  overrides: Partial<typeof processes.$inferSelect> = {},
): typeof processes.$inferSelect {
  return {
    id: PROCESS_ID,
    organizationId: ORGANIZATION_ID,
    type: "inexigibilidade",
    processNumber: "2026-001",
    externalId: null,
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    object: "Contratacao de apresentacao artistica",
    justification: "Atender evento cultural do municipio",
    responsibleName: "Ana Souza",
    status: "draft",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createDocumentRow(
  overrides: Partial<typeof documents.$inferSelect> = {},
): typeof documents.$inferSelect {
  return {
    id: DOCUMENT_ID,
    organizationId: ORGANIZATION_ID,
    processId: PROCESS_ID,
    name: "Documento exemplo",
    storageKey: "documents/processo/documento.pdf",
    responsibles: ["Ana Souza"],
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function parseCreateProcessInput(input: Parameters<typeof createProcessBodySchema.parse>[0]) {
  return createProcessBodySchema.parse(input);
}

function parseUpdateProcessInput(input: Parameters<typeof updateProcessBodySchema.parse>[0]) {
  return updateProcessBodySchema.parse(input);
}

test("process schemas canonicalize payloads and reject invalid updates", () => {
  const parsed = parseCreateProcessInput({
    type: "  inexigibilidade  ",
    processNumber: "  2026/001  ",
    externalId: "   ",
    issuedAt: "2026-01-08",
    object: "  Contratacao de apresentacao artistica  ",
    justification: "  Atender evento cultural  ",
    responsibleName: "  Ana Souza  ",
    departmentIds: [DEPARTMENT_ID, DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
  });

  assert.deepEqual(parsed, {
    type: "inexigibilidade",
    processNumber: "2026/001",
    externalId: null,
    issuedAt: "2026-01-08T00:00:00.000Z",
    object: "Contratacao de apresentacao artistica",
    justification: "Atender evento cultural",
    responsibleName: "Ana Souza",
    status: "draft",
    departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
  });

  assert.equal(
    updateProcessBodySchema.safeParse({
      departmentIds: [],
    }).success,
    false,
  );

  assert.equal(
    updateProcessBodySchema.safeParse({
      organizationId: OTHER_ORGANIZATION_ID,
    }).success,
    false,
  );
});

test("createProcess lets admins create for any organization and links departments", async () => {
  let insertedProcessValues: Record<string, unknown> | undefined;
  let insertedDepartmentLinks: Array<typeof processDepartments.$inferInsert> | undefined;

  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }, { id: SECOND_DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        if (table === processes) {
          const nextValues = values as Record<string, unknown>;
          insertedProcessValues = nextValues;

          return {
            returning: async () => [
              createProcessRow({
                organizationId: String(nextValues.organizationId),
                type: String(nextValues.type),
                processNumber: String(nextValues.processNumber),
                externalId: nextValues.externalId as string | null,
                issuedAt: nextValues.issuedAt as Date,
                object: String(nextValues.object),
                justification: String(nextValues.justification),
                responsibleName: String(nextValues.responsibleName),
                status: String(nextValues.status),
              }),
            ],
          };
        }

        insertedDepartmentLinks = values as Array<typeof processDepartments.$inferInsert>;

        return {
          returning: async () => [],
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    process: parseCreateProcessInput({
      type: "inexigibilidade",
      processNumber: "2026/001",
      externalId: "externo-123",
      organizationId: ORGANIZATION_ID,
      issuedAt: "2026-01-08",
      object: "Contratacao de apresentacao artistica",
      justification: "Atender evento cultural do municipio",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(insertedProcessValues?.organizationId, ORGANIZATION_ID);
  assert.equal(insertedProcessValues?.processNumber, "2026/001");
  assert.equal(insertedProcessValues?.externalId, "externo-123");
  assert.ok(insertedProcessValues?.issuedAt instanceof Date);
  assert.deepEqual(insertedDepartmentLinks, [
    { processId: PROCESS_ID, departmentId: DEPARTMENT_ID },
    { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
  ]);
  assert.equal(response.organizationId, ORGANIZATION_ID);
  assert.deepEqual(response.departmentIds, [DEPARTMENT_ID, SECOND_DEPARTMENT_ID]);
});

test("createProcess scopes members to their own organization and rejects foreign departments", async () => {
  const tx = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: DEPARTMENT_ID }];
          }

          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: () => {
        if (table === processes) {
          return {
            returning: async () => [createProcessRow()],
          };
        }

        return {
          returning: async () => [],
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createProcess({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    process: parseCreateProcessInput({
      type: "inexigibilidade",
      processNumber: "2026/001",
      organizationId: ORGANIZATION_ID,
      issuedAt: "2026-01-08",
      object: "Contratacao de apresentacao artistica",
      justification: "Atender evento cultural do municipio",
      responsibleName: "Ana Souza",
      departmentIds: [DEPARTMENT_ID],
    }),
  });

  assert.equal(response.organizationId, ORGANIZATION_ID);

  const failingDb = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: failingDb,
        process: parseCreateProcessInput({
          type: "inexigibilidade",
          processNumber: "2026/002",
          issuedAt: "2026-01-08",
          object: "Contratacao de apresentacao artistica",
          justification: "Atender evento cultural do municipio",
          responsibleName: "Ana Souza",
          departmentIds: [DEPARTMENT_ID, SECOND_DEPARTMENT_ID],
        }),
      }),
    BadRequestError,
  );
});

test("getProcesses returns paginated processes for admins and empty page without organization", async () => {
  let capturedListWhere: unknown;
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;

  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === processes) {
            return [{ total: 3 }];
          }

          return [
            { processId: PROCESS_ID, departmentId: DEPARTMENT_ID },
            { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
          ];
        },
      }),
    }),
    query: {
      processes: {
        findMany: async (options?: { where?: unknown; limit?: number; offset?: number }) => {
          capturedListWhere = options?.where;
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [createProcessRow()];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const adminResponse = await getProcesses({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    page: 2,
    pageSize: 2,
  });

  assert.equal(capturedListWhere, undefined);
  assert.equal(capturedLimit, 2);
  assert.equal(capturedOffset, 2);
  assert.equal(adminResponse.total, 3);
  assert.equal(adminResponse.totalPages, 2);
  assert.deepEqual(adminResponse.items[0]?.departmentIds, [SECOND_DEPARTMENT_ID, DEPARTMENT_ID]);

  const emptyResponse = await getProcesses({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: null,
    },
    db: {} as FastifyInstance["db"],
  });

  assert.deepEqual(emptyResponse.items, []);
  assert.equal(emptyResponse.total, 0);
  assert.equal(emptyResponse.totalPages, 0);
});

test("getProcess allows admins and rejects members outside organization", async () => {
  const db = {
    query: {
      processes: {
        findFirst: async () => createProcessRow({ organizationId: OTHER_ORGANIZATION_ID }),
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ departmentId: DEPARTMENT_ID }],
      }),
    }),
  } as unknown as FastifyInstance["db"];

  const response = await getProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    processId: PROCESS_ID,
  });

  assert.equal(response.organizationId, OTHER_ORGANIZATION_ID);

  await assert.rejects(
    () =>
      getProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db,
        processId: PROCESS_ID,
      }),
    ForbiddenError,
  );
});

test("updateProcess lets admins and members update fields and department links", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;
  let deletedProcessId: string | undefined;
  let insertedDepartmentLinks: Array<typeof processDepartments.$inferInsert> | undefined;

  const tx = {
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        if (table !== processes) {
          throw new Error("Only processes should be updated.");
        }

        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createProcessRow({
                type: String(values.type ?? "inexigibilidade"),
                processNumber: String(values.processNumber ?? "2026-001"),
                externalId: (values.externalId as string | null | undefined) ?? null,
                issuedAt:
                  (values.issuedAt as Date | undefined) ?? new Date("2026-01-08T00:00:00.000Z"),
                object: String(values.object ?? "Contratacao de apresentacao artistica"),
                justification: String(
                  values.justification ?? "Atender evento cultural do municipio",
                ),
                responsibleName: String(values.responsibleName ?? "Ana Souza"),
                status: String(values.status ?? "draft"),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
    delete: () => ({
      where: async () => {
        deletedProcessId = PROCESS_ID;
      },
    }),
    insert: (table: unknown) => ({
      values: (values: Array<typeof processDepartments.$inferInsert>) => {
        if (table !== processDepartments) {
          throw new Error("Only process department links should be inserted.");
        }

        insertedDepartmentLinks = values;

        return {
          returning: async () => [],
        };
      },
    }),
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          if (table === departments) {
            return [{ id: SECOND_DEPARTMENT_ID }];
          }

          return [{ departmentId: DEPARTMENT_ID }];
        },
      }),
    }),
  };

  const linkedDocument = createDocumentRow();

  const db = {
    query: {
      processes: {
        findFirst: async () => createProcessRow(),
      },
      documents: {
        findFirst: async () => linkedDocument,
      },
    },
    select: tx.select,
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const adminResponse = await updateProcess({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    processId: PROCESS_ID,
    changes: parseUpdateProcessInput({
      processNumber: "2026/099",
      externalId: "externo-999",
      status: "published",
      departmentIds: [SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(capturedUpdateValues?.processNumber, "2026/099");
  assert.equal(capturedUpdateValues?.externalId, "externo-999");
  assert.equal(capturedUpdateValues?.status, "published");
  assert.ok(capturedUpdateValues?.updatedAt instanceof Date);
  assert.equal(deletedProcessId, PROCESS_ID);
  assert.deepEqual(insertedDepartmentLinks, [
    { processId: PROCESS_ID, departmentId: SECOND_DEPARTMENT_ID },
  ]);
  assert.equal(adminResponse.processNumber, "2026/099");
  assert.equal(linkedDocument.processId, PROCESS_ID);

  const memberResponse = await updateProcess({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
    processId: PROCESS_ID,
    changes: parseUpdateProcessInput({
      justification: "Nova justificativa",
      departmentIds: [SECOND_DEPARTMENT_ID],
    }),
  });

  assert.equal(memberResponse.justification, "Nova justificativa");
});

test("updateProcess rejects actors outside scope and translates process number conflicts", async () => {
  const forbiddenDb = {
    query: {
      processes: {
        findFirst: async () => createProcessRow({ organizationId: OTHER_ORGANIZATION_ID }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateProcess({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: forbiddenDb,
        processId: PROCESS_ID,
        changes: parseUpdateProcessInput({
          object: "Novo objeto",
        }),
      }),
    ForbiddenError,
  );

  const conflictDb = {
    query: {
      processes: {
        findFirst: async () => createProcessRow(),
      },
    },
    transaction: async (
      callback: (transaction: {
        update: (table: unknown) => {
          set: (values: Record<string, unknown>) => {
            where: () => {
              returning: () => Promise<never>;
            };
          };
        };
      }) => Promise<unknown> | unknown,
    ) =>
      callback({
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => {
                throw {
                  code: "23505",
                  constraint: "processes_organization_process_number_unique",
                };
              },
            }),
          }),
        }),
      }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateProcess({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db: conflictDb,
        processId: PROCESS_ID,
        changes: parseUpdateProcessInput({
          processNumber: "2026/001",
        }),
      }),
    ConflictError,
  );
});
