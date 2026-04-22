import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import type { departments, organizations } from "../../db";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { createDepartment } from "./create-department";
import { createDepartmentBodySchema, updateDepartmentBodySchema } from "./departments.schemas";
import { getDepartment } from "./get-department";
import { getDepartments } from "./get-departments";
import { updateDepartment } from "./update-department";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";

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

function createDepartmentRow(
  overrides: Partial<typeof departments.$inferSelect> = {},
): typeof departments.$inferSelect {
  return {
    id: DEPARTMENT_ID,
    name: "Secretaria de Financas",
    slug: "secretaria-de-financas",
    organizationId: ORGANIZATION_ID,
    budgetUnitCode: null,
    responsibleName: "Ana Souza",
    responsibleRole: "Secretaria",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function parseCreateDepartmentInput(input: Parameters<typeof createDepartmentBodySchema.parse>[0]) {
  return createDepartmentBodySchema.parse(input);
}

function parseUpdateDepartmentInput(input: Parameters<typeof updateDepartmentBodySchema.parse>[0]) {
  return updateDepartmentBodySchema.parse(input);
}

test("department schemas canonicalize slug and require responsible fields", () => {
  const parsed = parseCreateDepartmentInput({
    name: "  Secretaria de Financas  ",
    slug: "  Secretaria de Financas  ",
    responsibleName: "  Ana Souza  ",
    responsibleRole: "  Secretaria  ",
  });

  assert.deepEqual(parsed, {
    name: "Secretaria de Financas",
    slug: "secretaria-de-financas",
    budgetUnitCode: null,
    responsibleName: "Ana Souza",
    responsibleRole: "Secretaria",
  });
  assert.equal(
    createDepartmentBodySchema.safeParse({
      name: "Secretaria de Financas",
      slug: "secretaria-de-financas",
      responsibleRole: "Secretaria",
    }).success,
    false,
  );

  const parsedWithBudgetUnit = parseCreateDepartmentInput({
    name: "Secretaria de Educacao",
    slug: "secretaria-de-educacao",
    budgetUnitCode: "  06.001  ",
    responsibleName: "Maria Rocha",
    responsibleRole: "Secretaria",
  });

  assert.equal(parsedWithBudgetUnit.budgetUnitCode, "06.001");
});

test("update department schema rejects organization reassignment input", () => {
  assert.equal(
    updateDepartmentBodySchema.safeParse({
      slug: "novo-slug",
      organizationId: OTHER_ORGANIZATION_ID,
    }).success,
    false,
  );
});

test("createDepartment lets admins create for any organization", async () => {
  let insertedValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedValues = values;

        return {
          returning: async () => [
            createDepartmentRow({
              name: String(values.name),
              slug: String(values.slug),
              budgetUnitCode: values.budgetUnitCode as string | null,
              organizationId: String(values.organizationId),
              responsibleName: String(values.responsibleName),
              responsibleRole: String(values.responsibleRole),
            }),
          ],
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await createDepartment({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    department: parseCreateDepartmentInput({
      name: "Secretaria de Financas",
      slug: "Secretaria de Financas",
      budgetUnitCode: "06.001",
      organizationId: ORGANIZATION_ID,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
    }),
  });

  assert.equal(insertedValues?.organizationId, ORGANIZATION_ID);
  assert.equal(insertedValues?.slug, "secretaria-de-financas");
  assert.equal(insertedValues?.budgetUnitCode, "06.001");
  assert.equal(response.organizationId, ORGANIZATION_ID);
  assert.equal(response.budgetUnitCode, "06.001");
});

test("createDepartment scopes organization owners to their own organization", async () => {
  let insertedValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedValues = values;

        return {
          returning: async () => [
            createDepartmentRow({
              organizationId: String(values.organizationId),
              budgetUnitCode: values.budgetUnitCode as string | null,
            }),
          ],
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  await createDepartment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    department: parseCreateDepartmentInput({
      name: "Secretaria de Financas",
      slug: "secretaria-de-financas",
      budgetUnitCode: "06.001",
      organizationId: ORGANIZATION_ID,
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
    }),
  });

  assert.equal(insertedValues?.organizationId, ORGANIZATION_ID);
  assert.equal(insertedValues?.budgetUnitCode, "06.001");
});

test("createDepartment rejects members and cross-organization owner writes", async () => {
  const db = {} as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createDepartment({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db,
        department: parseCreateDepartmentInput({
          name: "Secretaria de Financas",
          slug: "secretaria-de-financas",
          responsibleName: "Ana Souza",
          responsibleRole: "Secretaria",
        }),
      }),
    ForbiddenError,
  );

  await assert.rejects(
    () =>
      createDepartment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        department: parseCreateDepartmentInput({
          name: "Secretaria de Financas",
          slug: "secretaria-de-financas",
          organizationId: OTHER_ORGANIZATION_ID,
          responsibleName: "Ana Souza",
          responsibleRole: "Secretaria",
        }),
      }),
    ForbiddenError,
  );
});

test("getDepartments returns paginated departments for admins", async () => {
  let capturedWhere: unknown;
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;

  const db = {
    select: () => ({
      from: () => ({
        where: async (where: unknown) => {
          capturedWhere = where;
          return [{ total: 3 }];
        },
      }),
    }),
    query: {
      departments: {
        findMany: async (options?: { where?: unknown; limit?: number; offset?: number }) => {
          capturedWhere = options?.where;
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [
            createDepartmentRow(),
            createDepartmentRow({
              id: "8f8f8f8f-e2e5-4876-b4c3-b35306c6e733",
              slug: "secretaria-de-saude",
            }),
          ];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getDepartments({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    page: 2,
    pageSize: 2,
  });

  assert.equal(capturedWhere, undefined);
  assert.equal(capturedLimit, 2);
  assert.equal(capturedOffset, 2);
  assert.equal(response.total, 3);
  assert.equal(response.totalPages, 2);
  assert.equal(response.items.length, 2);
});

test("getDepartments scopes members and owners and returns empty page without organization", async () => {
  let capturedWhere: unknown;

  const db = {
    select: () => ({
      from: () => ({
        where: async (where: unknown) => {
          capturedWhere = where;
          return [{ total: 1 }];
        },
      }),
    }),
    query: {
      departments: {
        findMany: async (options?: { where?: unknown }) => {
          capturedWhere = options?.where;
          return [createDepartmentRow()];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const memberResponse = await getDepartments({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: ORGANIZATION_ID,
    },
    db,
  });

  assert.ok(capturedWhere);
  assert.equal(memberResponse.total, 1);

  const scopedResponse = await getDepartments({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
  });

  assert.ok(capturedWhere);
  assert.equal(scopedResponse.total, 1);

  const emptyResponse = await getDepartments({
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

test("getDepartment allows admins and rejects owners outside organization", async () => {
  const db = {
    query: {
      departments: {
        findFirst: async () => createDepartmentRow({ organizationId: OTHER_ORGANIZATION_ID }),
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getDepartment({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    departmentId: DEPARTMENT_ID,
  });

  assert.equal(response.organizationId, OTHER_ORGANIZATION_ID);

  await assert.rejects(
    () =>
      getDepartment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        departmentId: DEPARTMENT_ID,
      }),
    ForbiddenError,
  );
});

test("updateDepartment lets admins and owners update profile fields", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      departments: {
        findFirst: async () => createDepartmentRow(),
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createDepartmentRow({
                name: String(values.name ?? "Secretaria de Financas"),
                slug: String(values.slug ?? "secretaria-de-financas"),
                budgetUnitCode: values.budgetUnitCode as string | null | undefined,
                responsibleName: String(values.responsibleName ?? "Ana Souza"),
                responsibleRole: String(values.responsibleRole ?? "Secretaria"),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const adminResponse = await updateDepartment({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    departmentId: DEPARTMENT_ID,
    changes: parseUpdateDepartmentInput({
      slug: "Secretaria de Saude",
      budgetUnitCode: "06.002",
      responsibleRole: "Secretaria Municipal",
    }),
  });

  assert.equal(capturedUpdateValues?.slug, "secretaria-de-saude");
  assert.equal(capturedUpdateValues?.budgetUnitCode, "06.002");
  assert.equal(capturedUpdateValues?.responsibleRole, "Secretaria Municipal");
  assert.ok(capturedUpdateValues?.updatedAt instanceof Date);
  assert.equal(adminResponse.slug, "secretaria-de-saude");
  assert.equal(adminResponse.budgetUnitCode, "06.002");

  const ownerResponse = await updateDepartment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    departmentId: DEPARTMENT_ID,
    changes: parseUpdateDepartmentInput({
      name: "Secretaria de Educacao",
    }),
  });

  assert.equal(ownerResponse.name, "Secretaria de Educacao");
});

test("updateDepartment rejects members and translates slug conflicts", async () => {
  const memberDb = {
    query: {
      departments: {
        findFirst: async () => createDepartmentRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateDepartment({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: ORGANIZATION_ID,
        },
        db: memberDb,
        departmentId: DEPARTMENT_ID,
        changes: parseUpdateDepartmentInput({
          name: "Secretaria de Educacao",
        }),
      }),
    ForbiddenError,
  );

  const conflictDb = {
    query: {
      departments: {
        findFirst: async () => createDepartmentRow(),
      },
    },
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            throw {
              code: "23505",
              constraint: "departments_organization_slug_unique",
            };
          },
        }),
      }),
    }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateDepartment({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db: conflictDb,
        departmentId: DEPARTMENT_ID,
        changes: parseUpdateDepartmentInput({
          slug: "secretaria-de-financas",
        }),
      }),
    ConflictError,
  );

  const budgetConflictDb = {
    query: {
      departments: {
        findFirst: async () => createDepartmentRow(),
      },
    },
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            throw {
              code: "23505",
              constraint: "departments_organization_budget_unit_code_unique",
            };
          },
        }),
      }),
    }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateDepartment({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db: budgetConflictDb,
        departmentId: DEPARTMENT_ID,
        changes: parseUpdateDepartmentInput({
          budgetUnitCode: "06.001",
        }),
      }),
    ConflictError,
  );
});
