import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import type { organizations, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { createOrganization } from "./create-organization";
import { getCurrentOrganization } from "./get-current-organization";
import { getOrganization } from "./get-organization";
import { getOrganizations } from "./get-organizations";
import {
  createOrganizationBodySchema,
  updateOrganizationBodySchema,
} from "./organizations.schemas";
import { updateOrganization } from "./update-organization";

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
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
    website: "https://exemplo.ce.gov.br",
    logoUrl: "https://cdn.example.com/logo.png",
    authorityName: "Maria Silva",
    authorityRole: "Prefeita",
    isActive: true,
    createdByUserId: "owner_user",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createUserRow(
  overrides: Partial<typeof users.$inferSelect> = {},
): typeof users.$inferSelect {
  return {
    id: "owner_user",
    name: "Owner User",
    email: "owner@example.com",
    emailVerified: true,
    image: null,
    role: "organization_owner",
    organizationId: null,
    onboardingStatus: "pending_organization",
    temporaryPasswordCreatedAt: null,
    temporaryPasswordExpiresAt: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createNoConflictSelect(result: Array<{ id: string }> = []) {
  return () => ({
    from: () => ({
      where: () => ({
        limit: async () => result,
      }),
    }),
  });
}

function parseCreateOrganizationInput(
  input: Parameters<typeof createOrganizationBodySchema.parse>[0],
) {
  return createOrganizationBodySchema.parse(input);
}

function parseUpdateOrganizationInput(
  input: Parameters<typeof updateOrganizationBodySchema.parse>[0],
) {
  return updateOrganizationBodySchema.parse(input);
}

test("getOrganizations returns paginated organizations for admins", async () => {
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;
  let capturedWhere: unknown;

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
      organizations: {
        findMany: async (options?: { where?: unknown; limit?: number; offset?: number }) => {
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [
            createOrganizationRow(),
            createOrganizationRow({
              id: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
              slug: "prefeitura-2",
              cnpj: "98.765.432/0001-88",
            }),
          ];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getOrganizations({
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
  assert.equal(response.page, 2);
  assert.equal(response.pageSize, 2);
  assert.equal(response.total, 3);
  assert.equal(response.totalPages, 2);
  assert.equal(response.items[0]?.slug, "prefeitura-de-exemplo");
});

test("getOrganizations scopes organization owners to the owned organization", async () => {
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
      organizations: {
        findMany: async (options?: { where?: unknown }) => {
          capturedWhere = options?.where;
          return [createOrganizationRow()];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getOrganizations({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    },
    db,
  });

  assert.ok(capturedWhere);
  assert.equal(response.items.length, 1);
  assert.equal(response.items[0]?.id, "4fd5b7df-e2e5-4876-b4c3-b35306c6e733");
  assert.equal(response.total, 1);
});

test("getOrganizations returns an empty page for organization owners without organization", async () => {
  const db = {} as FastifyInstance["db"];

  const response = await getOrganizations({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: null,
    },
    db,
    page: 3,
    pageSize: 10,
  });

  assert.deepEqual(response.items, []);
  assert.equal(response.page, 3);
  assert.equal(response.pageSize, 10);
  assert.equal(response.total, 0);
  assert.equal(response.totalPages, 0);
});

test("getOrganization returns stored detail for admins", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getOrganization({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
  });

  assert.equal(response.cnpj, "12.345.678/0001-99");
  assert.equal(response.createdByUserId, "owner_user");
});

test("getOrganization rejects organization owners reading another organization", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () =>
          createOrganizationRow({ id: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228" }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      getOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        },
        db,
        organizationId: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
      }),
    ForbiddenError,
  );
});

test("getCurrentOrganization returns the stored detail for members in an organization", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getCurrentOrganization({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    },
    db,
  });

  assert.equal(response.id, "4fd5b7df-e2e5-4876-b4c3-b35306c6e733");
  assert.equal(response.name, "Prefeitura de Exemplo");
});

test("getCurrentOrganization rejects actors without organization", async () => {
  const db = {} as FastifyInstance["db"];

  await assert.rejects(
    () =>
      getCurrentOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: null,
        },
        db,
      }),
    BadRequestError,
  );
});

test("getCurrentOrganization rejects admins without a current organization", async () => {
  const db = {} as FastifyInstance["db"];

  await assert.rejects(
    () =>
      getCurrentOrganization({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db,
      }),
    ForbiddenError,
  );
});

test("organization schemas canonicalize create payloads while preserving formatting", () => {
  const parsed = parseCreateOrganizationInput({
    name: "  Prefeitura de Exemplo  ",
    slug: "  Prefeitura de Exemplo  ",
    officialName: "  Prefeitura Municipal de Exemplo  ",
    cnpj: "12.345.678/0001-99",
    city: "  Exemplo  ",
    state: "ce",
    address: "  Rua Principal, 100  ",
    zipCode: "60000-000",
    phone: "  (85) 3333-0000  ",
    institutionalEmail: "  CONTATO@EXEMPLO.CE.GOV.BR  ",
    website: "   ",
    logoUrl: null,
    authorityName: "  Maria Silva  ",
    authorityRole: "  Prefeita  ",
  });

  assert.deepEqual(parsed, {
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
  });
});

test("organization schemas canonicalize partial updates without injecting defaults", () => {
  const parsed = parseUpdateOrganizationInput({
    cnpj: "98.765.432/0001-88",
    state: "ce",
    zipCode: "60000-000",
    website: "   ",
  });

  assert.deepEqual(parsed, {
    cnpj: "98.765.432/0001-88",
    state: "CE",
    zipCode: "60000-000",
    website: null,
  });
  assert.equal("city" in parsed, false);
});

test("createOrganization creates the prefeitura and links the current organization owner", async () => {
  let insertedValues: Record<string, unknown> | undefined;
  let updatedUserValues: Record<string, unknown> | undefined;

  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () => createUserRow(),
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedValues = values;

        return {
          returning: async () => [
            createOrganizationRow({
              name: String(values.name),
              slug: String(values.slug),
              officialName: String(values.officialName),
              cnpj: String(values.cnpj),
              city: String(values.city),
              state: String(values.state),
              address: String(values.address),
              zipCode: String(values.zipCode),
              phone: String(values.phone),
              institutionalEmail: String(values.institutionalEmail),
              website: (values.website as string | null) ?? null,
              logoUrl: (values.logoUrl as string | null) ?? null,
              authorityName: String(values.authorityName),
              authorityRole: String(values.authorityRole),
              isActive: Boolean(values.isActive),
              createdByUserId: String(values.createdByUserId),
            }),
          ],
        };
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        updatedUserValues = values;

        return {
          where: () => ({
            returning: async () => [{ id: "owner_user" }],
          }),
        };
      },
    }),
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown> | unknown) =>
      callback(tx),
  } as unknown as FastifyInstance["db"];

  const response = await createOrganization({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: null,
    },
    db,
    organization: parseCreateOrganizationInput({
      name: "Prefeitura de Exemplo",
      slug: "Prefeitura de Exemplo",
      officialName: "Prefeitura Municipal de Exemplo",
      cnpj: "12.345.678/0001-99",
      city: "Exemplo",
      state: "ce",
      address: "Rua Principal, 100",
      zipCode: "60000-000",
      phone: "(85) 3333-0000",
      institutionalEmail: "CONTATO@EXEMPLO.CE.GOV.BR",
      website: "https://exemplo.ce.gov.br",
      logoUrl: "   ",
      authorityName: "Maria Silva",
      authorityRole: "Prefeita",
    }),
  });

  assert.equal(insertedValues?.slug, "prefeitura-de-exemplo");
  assert.equal(insertedValues?.cnpj, "12.345.678/0001-99");
  assert.equal(insertedValues?.state, "CE");
  assert.equal(insertedValues?.zipCode, "60000-000");
  assert.equal(insertedValues?.phone, "(85) 3333-0000");
  assert.equal(insertedValues?.institutionalEmail, "contato@exemplo.ce.gov.br");
  assert.equal(insertedValues?.logoUrl, null);
  assert.equal(insertedValues?.createdByUserId, "owner_user");
  assert.equal(insertedValues?.isActive, true);
  assert.equal(updatedUserValues?.organizationId, "4fd5b7df-e2e5-4876-b4c3-b35306c6e733");
  assert.equal(updatedUserValues?.onboardingStatus, "complete");
  assert.equal(updatedUserValues?.temporaryPasswordCreatedAt, null);
  assert.equal(updatedUserValues?.temporaryPasswordExpiresAt, null);
  assert.equal(response.createdByUserId, "owner_user");
});

test("createOrganization rejects owners before profile onboarding is completed", async () => {
  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () => createUserRow({ onboardingStatus: "pending_profile" }),
      },
    },
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: null,
        },
        db,
        organization: parseCreateOrganizationInput({
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
          authorityName: "Maria Silva",
          authorityRole: "Prefeita",
        }),
      }),
    (error: unknown) =>
      error instanceof BadRequestError &&
      error.message === "Owner profile onboarding must be completed first.",
  );
});

test("createOrganization rejects actors who already belong to an organization", async () => {
  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733" }),
      },
    },
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        },
        db,
        organization: parseCreateOrganizationInput({
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
          authorityName: "Maria Silva",
          authorityRole: "Prefeita",
        }),
      }),
    BadRequestError,
  );
});

test("createOrganization rejects actors with a different role", async () => {
  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () => createUserRow({ role: "member", organizationId: null }),
      },
    },
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createOrganization({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: null,
        },
        db,
        organization: parseCreateOrganizationInput({
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
          authorityName: "Maria Silva",
          authorityRole: "Prefeita",
        }),
      }),
    ForbiddenError,
  );
});

test("createOrganization rejects semantically duplicated cnpj with different punctuation", async () => {
  const tx = {
    select: createNoConflictSelect([{ id: "existing-organization" }]),
    query: {
      users: {
        findFirst: async () => createUserRow(),
      },
    },
  };

  const db = {
    transaction: async (callback: (transaction: typeof tx) => unknown) => callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      createOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: null,
        },
        db,
        organization: parseCreateOrganizationInput({
          name: "Prefeitura de Exemplo",
          slug: "prefeitura-de-exemplo",
          officialName: "Prefeitura Municipal de Exemplo",
          cnpj: "12345678000199",
          city: "Exemplo",
          state: "CE",
          address: "Rua Principal, 100",
          zipCode: "60000-000",
          phone: "(85) 3333-0000",
          institutionalEmail: "contato@exemplo.ce.gov.br",
          authorityName: "Maria Silva",
          authorityRole: "Prefeita",
        }),
      }),
    ConflictError,
  );
});

test("updateOrganization lets admins update governance and institutional fields", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;

  const db = {
    select: createNoConflictSelect(),
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                slug: String(values.slug),
                cnpj: String(values.cnpj),
                state: String(values.state),
                isActive: Boolean(values.isActive),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await updateOrganization({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    changes: parseUpdateOrganizationInput({
      slug: "Prefeitura Atualizada",
      cnpj: "98.765.432/0001-88",
      state: "ce",
      isActive: false,
    }),
  });

  assert.equal(capturedUpdateValues?.slug, "prefeitura-atualizada");
  assert.equal(capturedUpdateValues?.cnpj, "98.765.432/0001-88");
  assert.equal(capturedUpdateValues?.state, "CE");
  assert.equal(capturedUpdateValues?.isActive, false);
  assert.ok(capturedUpdateValues?.updatedAt instanceof Date);
  assert.equal(response.isActive, false);
  assert.equal(response.cnpj, "98.765.432/0001-88");
});

test("updateOrganization lets organization owners update their prefeitura profile", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                city: String(values.city),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await updateOrganization({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    },
    db,
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    changes: parseUpdateOrganizationInput({
      city: "Nova Cidade",
    }),
  });

  assert.equal(capturedUpdateValues?.city, "Nova Cidade");
  assert.equal(response.city, "Nova Cidade");
});

test("updateOrganization rejects organization owners changing admin-only fields", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        },
        db,
        organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        changes: {
          isActive: false,
        },
      }),
    ForbiddenError,
  );
});

test("updateOrganization rejects semantically duplicated cnpj with different punctuation", async () => {
  const db = {
    select: createNoConflictSelect([{ id: "another-organization" }]),
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateOrganization({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db,
        organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        changes: parseUpdateOrganizationInput({
          cnpj: "12345678000199",
        }),
      }),
    ConflictError,
  );
});

test("updateOrganization translates unique conflicts for slug", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            throw {
              code: "23505",
              constraint: "organizations_slug_unique",
            };
          },
        }),
      }),
    }),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateOrganization({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db,
        organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        changes: parseUpdateOrganizationInput({
          slug: "Outra Prefeitura",
        }),
      }),
    ConflictError,
  );
});
