import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import {
  departments as departmentsTable,
  documentGenerationRuns,
  documents,
  processDepartments,
  type organizations,
  type processes,
} from "../../db";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import {
  TextGenerationError,
  type TextGenerationProvider,
} from "../../shared/text-generation/types";
import { createDocument } from "./create-document";
import { createDocumentBodySchema } from "./documents.schemas";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";
const DOCUMENT_ID = "7a7a7a7a-e2e5-4876-b4c3-b35306c6e733";
const GENERATION_RUN_ID = "6b6b6b6b-e2e5-4876-b4c3-b35306c6e733";

function createOrganizationRow(
  overrides: Partial<typeof organizations.$inferSelect> = {},
): typeof organizations.$inferSelect {
  return {
    id: ORGANIZATION_ID,
    name: "Prefeitura de Exemplo",
    slug: "prefeitura-de-exemplo",
    officialName: "Prefeitura Municipal de Exemplo",
    cnpj: "12.345.678/0001-99",
    city: "Fortaleza",
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
    type: "pregao",
    processNumber: "PROC-2026-001",
    externalId: null,
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    object: "Aquisicao de materiais",
    justification: "Reposicao de estoque",
    responsibleName: "Ana Souza",
    status: "draft",
    sourceKind: null,
    sourceReference: null,
    sourceMetadata: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createDepartmentRow(
  overrides: Partial<typeof departmentsTable.$inferSelect> = {},
): typeof departmentsTable.$inferSelect {
  return {
    id: DEPARTMENT_ID,
    organizationId: ORGANIZATION_ID,
    name: "Secretaria Municipal de Cultura",
    slug: "secretaria-municipal-de-cultura",
    budgetUnitCode: "06.001",
    responsibleName: "Ana Souza",
    responsibleRole: "Secretaria Municipal",
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
    name: "DFD - PROC-2026-001",
    type: "dfd",
    status: "generating",
    draftContent: null,
    storageKey: null,
    responsibles: ["Ana Souza"],
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createTextGenerationProvider(
  generateText: TextGenerationProvider["generateText"],
): TextGenerationProvider {
  return {
    providerKey: "stub",
    model: "stub-model",
    generateText,
  };
}

function createDb({
  departments = [createDepartmentRow()],
  organization = createOrganizationRow(),
  processDepartmentIds = [DEPARTMENT_ID],
  process = createProcessRow(),
  onDocumentInsert,
  onDocumentUpdate,
  onGenerationRunUpdate,
}: {
  departments?: Array<typeof departmentsTable.$inferSelect>;
  organization?: typeof organizations.$inferSelect | null;
  processDepartmentIds?: string[];
  process?: typeof processes.$inferSelect | null;
  onDocumentInsert?: (values: Record<string, unknown>) => void;
  onDocumentUpdate?: (values: Record<string, unknown>) => void;
  onGenerationRunUpdate?: (values: Record<string, unknown>) => void;
} = {}) {
  const tx = {
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === documents) {
          onDocumentInsert?.(values);

          return {
            returning: async () => [createDocumentRow(values)],
          };
        }

        assert.equal(table, documentGenerationRuns);

        return {
          returning: async () => [
            {
              id: GENERATION_RUN_ID,
              ...values,
            },
          ],
        };
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          if (table === documents) {
            onDocumentUpdate?.(values);

            return {
              returning: async () => [createDocumentRow(values)],
            };
          }

          assert.equal(table, documentGenerationRuns);
          onGenerationRunUpdate?.(values);

          return Promise.resolve();
        },
      }),
    }),
  };

  return {
    query: {
      departments: {
        findMany: async () => departments,
      },
      organizations: {
        findFirst: async () => organization,
      },
      processes: {
        findFirst: async () => process,
      },
    },
    select: () => ({
      from: (table: unknown) => {
        assert.equal(table, processDepartments);

        return {
          where: async () => processDepartmentIds.map((departmentId) => ({ departmentId })),
        };
      },
    }),
    transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
  } as unknown as FastifyInstance["db"];
}

test("createDocument generates and persists a completed draft", async () => {
  let insertedDocument: Record<string, unknown> | undefined;
  let receivedPrompt: string | undefined;
  let updatedDocument: Record<string, unknown> | undefined;
  let updatedRun: Record<string, unknown> | undefined;

  const response = await createDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db: createDb({
      onDocumentInsert: (values) => {
        insertedDocument = values;
      },
      onDocumentUpdate: (values) => {
        updatedDocument = values;
      },
      onGenerationRunUpdate: (values) => {
        updatedRun = values;
      },
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
      instructions: "Usar linguagem objetiva.",
    }),
    textGeneration: createTextGenerationProvider(async (input) => {
      receivedPrompt = input.prompt;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: "Conteudo gerado do DFD",
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.equal(insertedDocument?.type, "dfd");
  assert.equal(insertedDocument?.status, "generating");
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, "Conteudo gerado do DFD");
  assert.equal(updatedRun?.status, "completed");
  assert.equal(response.status, "completed");
  assert.equal(response.draftContent, "Conteudo gerado do DFD");
  assert.match(receivedPrompt ?? "", /## Modelo Markdown canonico/);
  assert.match(receivedPrompt ?? "", /# DOCUMENTO DE FORMALIZACAO DE DEMANDA \(DFD\)/);
  assert.match(receivedPrompt ?? "", /Usar linguagem objetiva\./);
});

test("createDocumentBodySchema rejects unsupported document types", () => {
  assert.equal(
    createDocumentBodySchema.safeParse({
      processId: PROCESS_ID,
      documentType: "parecer",
    }).success,
    false,
  );
});

test("createDocument rejects actors outside the process organization", async () => {
  await assert.rejects(
    () =>
      createDocument({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: OTHER_ORGANIZATION_ID,
        },
        db: createDb(),
        document: createDocumentBodySchema.parse({
          processId: PROCESS_ID,
          documentType: "tr",
        }),
        textGeneration: createTextGenerationProvider(async () => ({
          providerKey: "stub",
          model: "stub-model",
          text: "Conteudo gerado",
          responseMetadata: {},
        })),
      }),
    ForbiddenError,
  );
});

test("createDocument persists failed state when the provider fails", async () => {
  let failedDocument: Record<string, unknown> | undefined;
  let failedRun: Record<string, unknown> | undefined;

  const response = await createDocument({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db: createDb({
      onDocumentUpdate: (values) => {
        failedDocument = values;
      },
      onGenerationRunUpdate: (values) => {
        failedRun = values;
      },
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "minuta",
    }),
    textGeneration: createTextGenerationProvider(async () => {
      throw new TextGenerationError({
        code: "rate_limited",
        message: "Provider rate limit exceeded.",
        providerKey: "stub",
        model: "stub-model",
      });
    }),
  });

  assert.equal(failedDocument?.status, "failed");
  assert.equal(failedRun?.status, "failed");
  assert.equal(failedRun?.errorCode, "rate_limited");
  assert.equal(response.status, "failed");
  assert.equal(response.draftContent, null);
});

test("createDocument strips ETP and TR sections from generated DFD content", async () => {
  let updatedDocument: Record<string, unknown> | undefined;

  const response = await createDocument({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db: createDb({
      onDocumentUpdate: (values) => {
        updatedDocument = values;
      },
      process: createProcessRow({
        sourceMetadata: {
          extractedFields: {
            budgetUnitCode: "06.001",
            budgetUnitName: "Secretaria Municipal de Cultura",
            requestNumber: "6",
          },
          warnings: [],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: [
        "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
        "",
        "## 1. DADOS DA SOLICITACAO",
        "- Numero da Solicitacao: 6",
        "",
        "## 6. FECHO",
        "Ana Souza",
        "",
        "## ESTUDO TECNICO PRELIMINAR (ETP)",
        "Conteudo que nao deve permanecer.",
        "",
        "## TERMO DE REFERENCIA",
        "Conteudo adicional indevido.",
      ].join("\n"),
      responseMetadata: {
        finishReason: "stop",
      },
    })),
  });

  assert.equal(
    updatedDocument?.draftContent,
    [
      "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
      "",
      "## 1. DADOS DA SOLICITACAO",
      "- Numero da Solicitacao: 6",
      "",
      "## 6. FECHO",
      "Ana Souza",
    ].join("\n"),
  );
  assert.equal(/ESTUDO TECNICO PRELIMINAR/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(response.draftContent ?? ""), false);
});
