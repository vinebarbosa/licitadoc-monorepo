import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import type { organizations, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import {
  type FileStorageProvider,
  getOrganizationAssetStorageKey,
  getOrganizationLetterheadStorageKey,
} from "../../shared/storage/types";
import { createOrganization } from "./create-organization";
import { getCurrentOrganization } from "./get-current-organization";
import { getOrganization } from "./get-organization";
import { getOrganizations } from "./get-organizations";
import { convertLetterheadDocxToJpeg } from "./letterhead-docx-converter";
import { getOrganizationAssetFile, uploadOrganizationAsset } from "./organization-assets";
import {
  createNormalizedLetterheadFileForImport,
  getLetterheadImageDimensions,
  getOrganizationLetterheadImage,
  normalizeLetterheadUpload,
  uploadOrganizationLetterhead,
} from "./organization-letterhead";
import {
  createOrganizationBodySchema,
  updateOrganizationBodySchema,
} from "./organizations.schemas";
import {
  PUREZA_CNPJ_DIGITS,
  resolvePurezaOrganizationForLetterhead,
  seedPurezaLetterhead,
} from "./pureza-letterhead-seed";
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
    crestUrl: null,
    letterheadUrl: null,
    letterheadTemplateUrl: null,
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

function createOrganizationPayload(overrides: Record<string, unknown> = {}) {
  return parseCreateOrganizationInput({
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
    ...overrides,
  });
}

function createPngBuffer(width: number, height: number) {
  const buffer = Buffer.alloc(24);
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);

  return buffer;
}

function createLetterheadUploadBody({
  buffer = createPngBuffer(1448, 2048),
  fileName = "papel_timbrado.png",
  mimeType = "image/png",
}: {
  buffer?: Buffer;
  fileName?: string;
  mimeType?: string;
} = {}) {
  return {
    file: {
      fieldname: "file",
      filename: fileName,
      mimetype: mimeType,
      toBuffer: async () => buffer,
      type: "file" as const,
    },
  };
}

function createLetterheadStorageStub({
  deletedObjects = [],
  storedObjects = [],
}: {
  deletedObjects?: Array<{ bucket: string; key: string }>;
  storedObjects?: Array<{
    contentType: string;
    fileName: string;
    organizationId: string;
    sizeBytes: number;
  }>;
} = {}): FileStorageProvider {
  return {
    deleteObject: async (object) => {
      deletedObjects.push(object);
    },
    getObject: async () => {
      throw new Error("not implemented");
    },
    storeExpenseRequestPdf: async () => {
      throw new Error("not implemented");
    },
    storeOrganizationAsset: async () => {
      throw new Error("not implemented");
    },
    storeOrganizationLetterhead: async (input) => {
      storedObjects.push({
        contentType: input.contentType,
        fileName: input.fileName,
        organizationId: input.organizationId,
        sizeBytes: input.buffer.byteLength,
      });

      return {
        bucket: "licitadoc-expense-requests",
        contentType: input.contentType,
        etag: "etag-letterhead",
        key: getOrganizationLetterheadStorageKey(input.organizationId),
        sizeBytes: input.buffer.byteLength,
        uploadedAt: "2026-05-18T12:00:00.000Z",
      };
    },
    storeSupportTicketImage: async () => {
      throw new Error("not implemented");
    },
  };
}

test("uploadOrganizationAsset stores logo and updates the organization asset URL", async () => {
  let capturedAsset: { assetKind: string; organizationId: string; sizeBytes: number } | undefined;
  let capturedUpdateValues: Record<string, unknown> | undefined;
  const organization = createOrganizationRow();
  const storage: FileStorageProvider = {
    ...createLetterheadStorageStub(),
    storeOrganizationAsset: async (input) => {
      capturedAsset = {
        assetKind: input.assetKind,
        organizationId: input.organizationId,
        sizeBytes: input.buffer.byteLength,
      };

      return {
        bucket: "licitadoc-expense-requests",
        contentType: input.contentType,
        etag: "etag-logo",
        key: getOrganizationAssetStorageKey(input.organizationId, input.assetKind),
        sizeBytes: input.buffer.byteLength,
        uploadedAt: "2026-05-22T00:00:00.000Z",
      };
    },
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => organization,
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                logoUrl: String(values.logoUrl),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await uploadOrganizationAsset({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: organization.id,
    },
    assetKind: "logo",
    body: createLetterheadUploadBody({ fileName: "logo.svg", mimeType: "image/svg+xml" }),
    db,
    maxBytes: 5 * 1024 * 1024,
    organizationId: organization.id,
    storage,
  });

  assert.deepEqual(capturedAsset, {
    assetKind: "logo",
    organizationId: organization.id,
    sizeBytes: createPngBuffer(1448, 2048).byteLength,
  });
  assert.equal(capturedUpdateValues?.logoUrl, `/api/organizations/${organization.id}/logo/file`);
  assert.equal(response.logoUrl, `/api/organizations/${organization.id}/logo/file`);
});

test("getOrganizationAssetFile enforces visibility and returns storage key", async () => {
  const organization = createOrganizationRow({
    crestUrl: "/api/organizations/4fd5b7df-e2e5-4876-b4c3-b35306c6e733/crest/file",
  });
  const db = {
    query: {
      organizations: {
        findFirst: async () => organization,
      },
    },
  } as unknown as FastifyInstance["db"];

  const asset = await getOrganizationAssetFile({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: organization.id,
    },
    assetKind: "crest",
    db,
    organizationId: organization.id,
  });

  assert.equal(asset.fileName, "brasao");
  assert.equal(asset.storageKey, getOrganizationAssetStorageKey(organization.id, "crest"));

  await assert.rejects(
    () =>
      getOrganizationAssetFile({
        actor: {
          id: "other_member",
          role: "member",
          organizationId: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
        },
        assetKind: "crest",
        db,
        organizationId: organization.id,
      }),
    ForbiddenError,
  );
});

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
  const parsed = createOrganizationPayload({
    name: "  Prefeitura de Exemplo  ",
    slug: "  Prefeitura de Exemplo  ",
    officialName: "  Prefeitura Municipal de Exemplo  ",
    city: "  Exemplo  ",
    address: "  Rua Principal, 100  ",
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
    organization: createOrganizationPayload(),
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

test("createOrganization stores an optional onboarding letterhead before completing onboarding", async () => {
  let updatedUserValues: Record<string, unknown> | undefined;
  let capturedLetterheadValues: Record<string, unknown> | undefined;
  const storedObjects: Array<{
    contentType: string;
    fileName: string;
    organizationId: string;
    sizeBytes: number;
  }> = [];
  const createdOrganization = createOrganizationRow();

  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () => createUserRow(),
      },
    },
    insert: () => ({
      values: () => ({
        returning: async () => [createdOrganization],
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        if ("letterheadUrl" in values) {
          capturedLetterheadValues = values;

          return {
            where: () => ({
              returning: async () => [
                createOrganizationRow({
                  letterheadUrl: String(values.letterheadUrl),
                }),
              ],
            }),
          };
        }

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
  const letterheadFile = await normalizeLetterheadUpload({
    body: createLetterheadUploadBody(),
    maxImageBytes: 5 * 1024 * 1024,
  });

  const response = await createOrganization({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: null,
    },
    db,
    letterheadFile,
    organization: createOrganizationPayload(),
    storage: createLetterheadStorageStub({ storedObjects }),
  });

  assert.equal(storedObjects.length, 1);
  assert.equal(storedObjects[0]?.organizationId, createdOrganization.id);
  assert.equal(
    capturedLetterheadValues?.letterheadUrl,
    `/api/organizations/${createdOrganization.id}/letterhead/image`,
  );
  assert.equal(updatedUserValues?.onboardingStatus, "complete");
  assert.deepEqual(response.letterhead, {
    url: `/api/organizations/${createdOrganization.id}/letterhead/image`,
  });
});

test("createOrganization does not complete onboarding when letterhead storage fails", async () => {
  let updatedUserValues: Record<string, unknown> | undefined;
  const tx = {
    select: createNoConflictSelect(),
    query: {
      users: {
        findFirst: async () => createUserRow(),
      },
    },
    insert: () => ({
      values: () => ({
        returning: async () => [createOrganizationRow()],
      }),
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
  const letterheadFile = await normalizeLetterheadUpload({
    body: createLetterheadUploadBody(),
    maxImageBytes: 5 * 1024 * 1024,
  });
  const storage = {
    ...createLetterheadStorageStub(),
    storeOrganizationLetterhead: async () => {
      throw new Error("storage unavailable");
    },
  };

  await assert.rejects(
    () =>
      createOrganization({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: null,
        },
        db,
        letterheadFile,
        organization: createOrganizationPayload(),
        storage,
      }),
    /storage unavailable/,
  );

  assert.equal(updatedUserValues, undefined);
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
        organization: createOrganizationPayload({
          website: undefined,
          logoUrl: undefined,
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
        organization: createOrganizationPayload({
          website: undefined,
          logoUrl: undefined,
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
        organization: createOrganizationPayload({
          website: undefined,
          logoUrl: undefined,
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
        organization: createOrganizationPayload({
          cnpj: "12345678000199",
          website: undefined,
          logoUrl: undefined,
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

test("serialize organization responses with null and populated letterhead url", async () => {
  const db = {
    query: {
      organizations: {
        findFirst: async () =>
          createOrganizationRow({
            letterheadUrl:
              "/api/organizations/4fd5b7df-e2e5-4876-b4c3-b35306c6e733/letterhead/image",
          }),
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

  assert.deepEqual(response.letterhead, {
    url: "/api/organizations/4fd5b7df-e2e5-4876-b4c3-b35306c6e733/letterhead/image",
  });

  const emptyDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];
  const emptyResponse = await getOrganization({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db: emptyDb,
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
  });

  assert.equal(emptyResponse.letterhead, null);
});

test("organization update schema rejects raw letterhead fields", () => {
  assert.throws(() =>
    parseUpdateOrganizationInput({
      letterheadUrl: "/api/organizations/raw/letterhead/image",
    }),
  );
});

test("uploadOrganizationLetterhead stores only the active letterhead url", async () => {
  const deletedObjects: Array<{ bucket: string; key: string }> = [];
  const storedObjects: Array<{
    contentType: string;
    fileName: string;
    organizationId: string;
    sizeBytes: number;
  }> = [];
  let capturedUpdateValues: Record<string, unknown> | undefined;
  const existingOrganization = createOrganizationRow({
    letterheadUrl: `/api/organizations/4fd5b7df-e2e5-4876-b4c3-b35306c6e733/letterhead/image`,
  });
  const db = {
    query: {
      organizations: {
        findFirst: async () => existingOrganization,
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                letterheadUrl: String(values.letterheadUrl),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];
  const storage = createLetterheadStorageStub({ deletedObjects, storedObjects });
  let converterCalls = 0;

  const response = await uploadOrganizationLetterhead({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: existingOrganization.id,
    },
    body: createLetterheadUploadBody(),
    convertDocx: async () => {
      converterCalls += 1;
      throw new Error("image uploads must not be converted");
    },
    db,
    maxImageBytes: 5 * 1024 * 1024,
    organizationId: existingOrganization.id,
    storage,
  });

  assert.equal(storedObjects.length, 1);
  assert.equal(storedObjects[0]?.organizationId, existingOrganization.id);
  assert.equal(storedObjects[0]?.contentType, "image/png");
  assert.equal(converterCalls, 0);
  assert.deepEqual(Object.keys(capturedUpdateValues ?? {}).sort(), ["letterheadUrl", "updatedAt"]);
  assert.equal(
    response.letterhead?.url,
    `/api/organizations/${existingOrganization.id}/letterhead/image`,
  );
  assert.deepEqual(deletedObjects, []);
});

test("uploadOrganizationLetterhead converts DOCX uploads into the active JPEG letterhead", async () => {
  const storedObjects: Array<{
    contentType: string;
    fileName: string;
    organizationId: string;
    sizeBytes: number;
  }> = [];
  let capturedUpdateValues: Record<string, unknown> | undefined;
  let capturedDocx: { fileName: string; sizeBytes: number } | undefined;
  const organization = createOrganizationRow();
  const db = {
    query: {
      organizations: {
        findFirst: async () => organization,
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                letterheadUrl: String(values.letterheadUrl),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await uploadOrganizationLetterhead({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: organization.id,
    },
    body: createLetterheadUploadBody({
      buffer: Buffer.from("docx-source"),
      fileName: "papel-timbrado.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    convertDocx: async ({ buffer, fileName }) => {
      capturedDocx = { fileName, sizeBytes: buffer.byteLength };

      return {
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
        contentType: "image/jpeg",
        fileName: "papel-timbrado.jpg",
      };
    },
    db,
    maxDocxBytes: 20 * 1024 * 1024,
    maxImageBytes: 5 * 1024 * 1024,
    organizationId: organization.id,
    storage: createLetterheadStorageStub({ storedObjects }),
  });

  assert.deepEqual(capturedDocx, {
    fileName: "papel-timbrado.docx",
    sizeBytes: Buffer.from("docx-source").byteLength,
  });
  assert.equal(storedObjects.length, 1);
  assert.equal(storedObjects[0]?.contentType, "image/jpeg");
  assert.equal(storedObjects[0]?.fileName, "papel-timbrado.jpg");
  assert.equal(
    capturedUpdateValues?.letterheadUrl,
    `/api/organizations/${organization.id}/letterhead/image`,
  );
  assert.deepEqual(response.letterhead, {
    url: `/api/organizations/${organization.id}/letterhead/image`,
  });
});

test("uploadOrganizationLetterhead rejects DOCX conversion failures before storage", async () => {
  let storeCalls = 0;
  const organization = createOrganizationRow();
  const db = {
    query: {
      organizations: {
        findFirst: async () => organization,
      },
    },
  } as unknown as FastifyInstance["db"];
  const storage: FileStorageProvider = {
    ...createLetterheadStorageStub(),
    storeOrganizationLetterhead: async () => {
      storeCalls += 1;
      throw new Error("should not store");
    },
  };

  await assert.rejects(
    () =>
      uploadOrganizationLetterhead({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: organization.id,
        },
        body: createLetterheadUploadBody({
          buffer: Buffer.from("bad-docx"),
          fileName: "papel-timbrado.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
        convertDocx: async () => {
          throw new BadRequestError("Não foi possível converter o DOCX do papel timbrado.");
        },
        db,
        maxDocxBytes: 20 * 1024 * 1024,
        maxImageBytes: 5 * 1024 * 1024,
        organizationId: organization.id,
        storage,
      }),
    BadRequestError,
  );

  assert.equal(storeCalls, 0);
});

test("convertLetterheadDocxToJpeg reports missing converter runtime clearly", async () => {
  await assert.rejects(
    () =>
      convertLetterheadDocxToJpeg({
        buffer: Buffer.from("docx-source"),
        fileName: "papel-timbrado.docx",
        libreOfficeBinary: "licitadoc-missing-soffice",
      }),
    /conversor de DOCX para timbre não está configurado/,
  );
});

test("uploadOrganizationLetterhead rejects invalid or unauthorized uploads before storage", async () => {
  let storeCalls = 0;
  const storage: FileStorageProvider = {
    ...createLetterheadStorageStub(),
    storeOrganizationLetterhead: async () => {
      storeCalls += 1;
      throw new Error("should not store");
    },
  };
  const db = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      uploadOrganizationLetterhead({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
        },
        body: createLetterheadUploadBody(),
        db,
        maxImageBytes: 5 * 1024 * 1024,
        organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        storage,
      }),
    ForbiddenError,
  );

  await assert.rejects(
    () =>
      uploadOrganizationLetterhead({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        body: createLetterheadUploadBody({ mimeType: "text/plain" }),
        db,
        maxImageBytes: 5 * 1024 * 1024,
        organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
        storage,
      }),
    BadRequestError,
  );

  assert.equal(storeCalls, 0);
});

test("getOrganizationLetterheadImage enforces visibility and missing letterhead behavior", async () => {
  const organizationWithLetterhead = createOrganizationRow({
    letterheadUrl: "/api/organizations/4fd5b7df-e2e5-4876-b4c3-b35306c6e733/letterhead/image",
  });
  const db = {
    query: {
      organizations: {
        findFirst: async () => organizationWithLetterhead,
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getOrganizationLetterheadImage({
    actor: {
      id: "member_user",
      role: "member",
      organizationId: organizationWithLetterhead.id,
    },
    db,
    organizationId: organizationWithLetterhead.id,
  });

  assert.equal(
    response.storageKey,
    getOrganizationLetterheadStorageKey(organizationWithLetterhead.id),
  );

  await assert.rejects(
    () =>
      getOrganizationLetterheadImage({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
        },
        db,
        organizationId: organizationWithLetterhead.id,
      }),
    ForbiddenError,
  );

  const emptyDb = {
    query: {
      organizations: {
        findFirst: async () => createOrganizationRow(),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      getOrganizationLetterheadImage({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db: emptyDb,
        organizationId: organizationWithLetterhead.id,
      }),
    NotFoundError,
  );
});

test("letterhead image validation extracts PNG dimensions and rejects zero-byte files", () => {
  const dimensions = getLetterheadImageDimensions(createPngBuffer(1448, 2048), "image/png");

  assert.deepEqual(dimensions, { width: 1448, height: 2048 });
  assert.throws(
    () =>
      createNormalizedLetterheadFileForImport({
        buffer: Buffer.alloc(0),
        contentType: "image/png",
        fileName: "papel_timbrado.png",
        maxBytes: 5 * 1024 * 1024,
      }),
    BadRequestError,
  );
});

test("Pureza letterhead seed resolves by target organization and fails before upload when missing", async () => {
  assert.equal(PUREZA_CNPJ_DIGITS, "08290223000142");

  const organization = createOrganizationRow({
    cnpj: "08.290.223/0001-42",
    id: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    slug: "prefeitura-de-pureza",
  });
  const db = {
    query: {
      organizations: {
        findFirst: async () => {
          return organization;
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const resolvedOrganization = await resolvePurezaOrganizationForLetterhead({
    db,
    organizationId: organization.id,
  });

  assert.equal(resolvedOrganization?.id, organization.id);

  const missingDb = {
    query: {
      organizations: {
        findFirst: async () => null,
      },
    },
  } as unknown as FastifyInstance["db"];
  let readCalls = 0;
  let storeCalls = 0;
  const storage: FileStorageProvider = {
    ...createLetterheadStorageStub(),
    storeOrganizationLetterhead: async () => {
      storeCalls += 1;
      throw new Error("should not store");
    },
  };

  await assert.rejects(
    () =>
      seedPurezaLetterhead({
        db: missingDb,
        maxBytes: 5 * 1024 * 1024,
        readFile: async () => {
          readCalls += 1;
          return createPngBuffer(1448, 2048);
        },
        storage,
      }),
    NotFoundError,
  );

  assert.equal(readCalls, 0);
  assert.equal(storeCalls, 0);
});

test("Pureza letterhead seed uploads the configured PNG when the organization is resolved", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;
  const organization = createOrganizationRow({
    cnpj: "08.290.223/0001-42",
    slug: "prefeitura-de-pureza",
  });
  const db = {
    query: {
      organizations: {
        findFirst: async () => organization,
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createOrganizationRow({
                letterheadUrl: String(values.letterheadUrl),
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];
  const storedObjects: Array<{
    contentType: string;
    fileName: string;
    organizationId: string;
    sizeBytes: number;
  }> = [];

  const updatedOrganization = await seedPurezaLetterhead({
    db,
    filePath: "/tmp/papel_timbrado.png",
    maxBytes: 5 * 1024 * 1024,
    readFile: async () => createPngBuffer(1448, 2048),
    storage: createLetterheadStorageStub({ storedObjects }),
  });

  assert.equal(storedObjects.length, 1);
  assert.equal(storedObjects[0]?.fileName, "papel_timbrado.png");
  assert.equal(
    capturedUpdateValues?.letterheadUrl,
    `/api/organizations/${organization.id}/letterhead/image`,
  );
  assert.equal(updatedOrganization.letterheadUrl, capturedUpdateValues?.letterheadUrl);
});
