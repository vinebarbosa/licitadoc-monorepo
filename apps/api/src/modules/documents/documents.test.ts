import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import {
  type departments as departmentsTable,
  documentGenerationRuns,
  documents,
  type organizations,
  processDepartments,
  type processes,
} from "../../db";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import {
  TextGenerationError,
  type TextGenerationProvider,
} from "../../shared/text-generation/types";
import { createDocument } from "./create-document";
import { createDocumentBodySchema } from "./documents.schemas";
import { getDocuments } from "./get-documents";

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

test("createDocument uses the canonical ETP recipe and zero-value safety", async () => {
  let receivedPrompt: string | undefined;
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
        sourceKind: "expense_request",
        sourceReference: "SD-6-2026",
        sourceMetadata: {
          extractedFields: {
            budgetUnitCode: "06.001",
            budgetUnitName: "Secretaria Municipal de Cultura",
            item: {
              description: "Apresentacao artistica musical",
              totalValue: "R$ 0,00",
            },
            requestNumber: "6",
          },
          warnings: ["item_value_missing"],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "etp",
      instructions: "Manter consistencia com o DFD.",
    }),
    textGeneration: createTextGenerationProvider(async (input) => {
      receivedPrompt = input.prompt;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: [
          "# ESTUDO TECNICO PRELIMINAR (ETP)",
          "",
          "## 1. INTRODUCAO",
          "Conteudo gerado do ETP.",
          "",
          "## 5. ESTIMATIVA DO VALOR DA CONTRATACAO",
          "Valor nao informado no contexto; sera objeto de apuracao posterior.",
        ].join("\n"),
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.match(receivedPrompt ?? "", /# ESTUDO TECNICO PRELIMINAR \(ETP\)/);
  assert.match(receivedPrompt ?? "", /- Estimativa disponivel: nao/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /nao simule pesquisa de mercado/i);
  assert.match(receivedPrompt ?? "", /Manter consistencia com o DFD\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.match(response.draftContent ?? "", /ESTIMATIVA DO VALOR DA CONTRATACAO/);
  assert.match(response.draftContent ?? "", /Valor nao informado no contexto/);
});

test("createDocument uses the canonical TR recipe and zero-value safety", async () => {
  let receivedPrompt: string | undefined;
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
        object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
        sourceKind: "expense_request",
        sourceReference: "SD-6-2026",
        sourceMetadata: {
          extractedFields: {
            budgetUnitCode: "06.001",
            budgetUnitName: "Secretaria Municipal de Cultura",
            item: {
              description: "Apresentacao artistica musical",
              totalValue: "R$ 0,00",
            },
            requestNumber: "6",
          },
          warnings: ["item_value_missing"],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "tr",
      instructions: "Manter consistencia operacional com o ETP.",
    }),
    textGeneration: createTextGenerationProvider(async (input) => {
      receivedPrompt = input.prompt;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: [
          "# TERMO DE REFERENCIA",
          "",
          "## 1. OBJETO",
          "Conteudo gerado do TR.",
          "",
          "## 7. VALOR ESTIMADO E DOTACAO ORCAMENTARIA",
          "Valor nao informado no contexto; sera apurado posteriormente por pesquisa de mercado.",
        ].join("\n"),
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.match(receivedPrompt ?? "", /# TERMO DE REFERENCIA/);
  assert.match(receivedPrompt ?? "", /- Tipo de documento: TR/);
  assert.match(
    receivedPrompt ?? "",
    /- Tipo de contratacao inferido para obrigacoes: apresentacao_artistica/,
  );
  assert.match(receivedPrompt ?? "", /- Estimativa disponivel: nao/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(receivedPrompt ?? "", /nao invente valores/i);
  assert.match(receivedPrompt ?? "", /Manter consistencia operacional com o ETP\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.match(response.draftContent ?? "", /VALOR ESTIMADO E DOTACAO ORCAMENTARIA/);
  assert.match(response.draftContent ?? "", /Valor nao informado no contexto/);
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

test("createDocument persists a custom name when provided", async () => {
  let insertedDocument: Record<string, unknown> | undefined;

  await createDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db: createDb({
      onDocumentInsert: (values) => {
        insertedDocument = values;
      },
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
      name: "Meu DFD Personalizado",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: "Conteudo",
      responseMetadata: { finishReason: "stop" },
    })),
  });

  assert.equal(insertedDocument?.name, "Meu DFD Personalizado");
});

test("createDocument uses generated name when custom name is blank or omitted", async () => {
  let insertedWithBlank: Record<string, unknown> | undefined;
  let insertedWithOmit: Record<string, unknown> | undefined;

  await createDocument({
    actor: { id: "admin_user", role: "admin", organizationId: null },
    db: createDb({
      onDocumentInsert: (v) => {
        insertedWithBlank = v;
      },
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "etp",
      name: "   ",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: "Conteudo",
      responseMetadata: { finishReason: "stop" },
    })),
  });

  await createDocument({
    actor: { id: "admin_user", role: "admin", organizationId: null },
    db: createDb({
      onDocumentInsert: (v) => {
        insertedWithOmit = v;
      },
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "etp",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: "Conteudo",
      responseMetadata: { finishReason: "stop" },
    })),
  });

  assert.equal(insertedWithBlank?.name, "ETP - PROC-2026-001");
  assert.equal(insertedWithOmit?.name, "ETP - PROC-2026-001");
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

test("createDocument strips DFD and TR sections from generated ETP content", async () => {
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
            item: {
              totalValue: "0,00",
            },
            requestNumber: "6",
          },
          warnings: [],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "etp",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: [
        "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
        "Conteudo que deve ser descartado.",
        "",
        "# ESTUDO TECNICO PRELIMINAR (ETP)",
        "",
        "## 1. INTRODUCAO",
        "Conteudo ETP valido.",
        "",
        "## 5. ESTIMATIVA DO VALOR DA CONTRATACAO",
        "Valor R$ 0,00.",
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
      "# ESTUDO TECNICO PRELIMINAR (ETP)",
      "",
      "## 1. INTRODUCAO",
      "Conteudo ETP valido.",
      "",
      "## 5. ESTIMATIVA DO VALOR DA CONTRATACAO",
      "Valor nao informado.",
    ].join("\n"),
  );
  assert.equal(/DOCUMENTO DE FORMALIZACAO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(response.draftContent ?? ""), false);
  assert.equal(/R\$ 0,00/i.test(response.draftContent ?? ""), false);
});

test("createDocument keeps an ETP estimate section when generated content omits it", async () => {
  const response = await createDocument({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db: createDb(),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "etp",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: [
        "# ESTUDO TECNICO PRELIMINAR (ETP)",
        "",
        "## 1. INTRODUCAO",
        "Conteudo ETP valido.",
      ].join("\n"),
      responseMetadata: {},
    })),
  });

  assert.match(response.draftContent ?? "", /## 5\. ESTIMATIVA DO VALOR DA CONTRATACAO/);
  assert.match(response.draftContent ?? "", /sera objeto de apuracao posterior/);
});

test("createDocument strips DFD and ETP sections from generated TR content", async () => {
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
            item: {
              totalValue: "0,00",
            },
            requestNumber: "6",
          },
          warnings: [],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "tr",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: [
        "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
        "Conteudo que deve ser descartado.",
        "",
        "# TERMO DE REFERENCIA",
        "",
        "## 1. OBJETO",
        "Conteudo TR valido.",
        "",
        "## 7. VALOR ESTIMADO E DOTACAO ORCAMENTARIA",
        "Valor R$ 0,00.",
        "",
        "## LEVANTAMENTO DE MERCADO",
        "Conteudo analitico indevido.",
        "",
        "## ESTUDO TECNICO PRELIMINAR (ETP)",
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
      "# TERMO DE REFERENCIA",
      "",
      "## 1. OBJETO",
      "Conteudo TR valido.",
      "",
      "## 7. VALOR ESTIMADO E DOTACAO ORCAMENTARIA",
      "Valor nao informado.",
    ].join("\n"),
  );
  assert.equal(/DOCUMENTO DE FORMALIZACAO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/ESTUDO TECNICO PRELIMINAR/i.test(response.draftContent ?? ""), false);
  assert.equal(/LEVANTAMENTO DE MERCADO/i.test(response.draftContent ?? ""), false);
  assert.equal(/R\$ 0,00/i.test(response.draftContent ?? ""), false);
});

test("createDocument keeps a TR value-estimate section when generated content omits it", async () => {
  const response = await createDocument({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db: createDb(),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "tr",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: ["# TERMO DE REFERENCIA", "", "## 1. OBJETO", "Conteudo TR valido."].join("\n"),
      responseMetadata: {},
    })),
  });

  assert.match(response.draftContent ?? "", /## 7\. VALOR ESTIMADO E DOTACAO ORCAMENTARIA/);
  assert.match(response.draftContent ?? "", /pesquisa de mercado ou etapa propria/);
});

test("createDocument uses the canonical Minuta recipe, placeholders, and FIXED clause rules", async () => {
  let receivedPrompt: string | undefined;
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
        object: "Contratacao de apresentacao artistica musical da banda FORRO TSUNAMI",
        sourceKind: "expense_request",
        sourceReference: "SD-6-2026",
        sourceMetadata: {
          extractedFields: {
            budgetUnitCode: "06.001",
            budgetUnitName: "Secretaria Municipal de Cultura",
            item: {
              description: "Apresentacao artistica musical",
              totalValue: "R$ 0,00",
            },
            requestNumber: "6",
          },
          warnings: ["item_value_missing"],
        },
      }),
    }),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "minuta",
      instructions: "Manter consistencia contratual com o TR.",
    }),
    textGeneration: createTextGenerationProvider(async (input) => {
      receivedPrompt = input.prompt;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: [
          "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)",
          "Conteudo que deve ser descartado.",
          "",
          "# MINUTA DO CONTRATO N. XXX/2026",
          "",
          "## CLAUSULA PRIMEIRA - DO OBJETO",
          "Objeto contratual valido.",
          "",
          "## CLAUSULA SEGUNDA - DO PRECO",
          "Valor R$ 0,00.",
          "",
          "## CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS",
          "Texto reescrito indevidamente.",
          "",
          "## TERMO DE REFERENCIA",
          "Conteudo adicional indevido.",
        ].join("\n"),
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.match(receivedPrompt ?? "", /# MINUTA DO CONTRATO/);
  assert.match(receivedPrompt ?? "", /- Tipo de documento: MINUTA/);
  assert.match(
    receivedPrompt ?? "",
    /- Tipo de contratacao inferido para obrigacoes: apresentacao_artistica/,
  );
  assert.match(receivedPrompt ?? "", /- Preco disponivel: nao/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraido da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /- Valor a usar na clausula DO PRECO: R\$ XX\.XXX,XX/);
  assert.match(receivedPrompt ?? "", /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(receivedPrompt ?? "", /Clausulas FIXED do template:/);
  assert.match(receivedPrompt ?? "", /Manter consistencia contratual com o TR\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.equal(/DOCUMENTO DE FORMALIZACAO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERENCIA/i.test(response.draftContent ?? ""), false);
  assert.equal(/R\$ 0,00/i.test(response.draftContent ?? ""), false);
  assert.equal(/Texto reescrito indevidamente/i.test(response.draftContent ?? ""), false);
  assert.match(response.draftContent ?? "", /R\$ XX\.XXX,XX/);
  assert.match(
    response.draftContent ?? "",
    /13\.1\. A CONTRATADA reconhece os direitos da CONTRATANTE relativos ao presente contrato/,
  );
  assert.match(response.draftContent ?? "", /## CLAUSULA DECIMA OITAVA - DO FORO/);
});

test("createDocument keeps Minuta price and FIXED clauses when generated content omits them", async () => {
  const response = await createDocument({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db: createDb(),
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "minuta",
    }),
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: [
        "# MINUTA DO CONTRATO N. XXX/2026",
        "",
        "## CLAUSULA PRIMEIRA - DO OBJETO",
        "Objeto contratual valido.",
      ].join("\n"),
      responseMetadata: {},
    })),
  });

  assert.match(response.draftContent ?? "", /## CLAUSULA SEGUNDA - DO PRECO/);
  assert.match(response.draftContent ?? "", /R\$ XX\.XXX,XX/);
  assert.match(response.draftContent ?? "", /## CLAUSULA DECIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(response.draftContent ?? "", /## CLAUSULA DECIMA OITAVA - DO FORO/);
  assert.equal(/FIXED_CLAUSE/i.test(response.draftContent ?? ""), false);
});

function createGetDocumentsDb({
  documentRows = [createDocumentRow()],
  processRows = [createProcessRow()],
}: {
  documentRows?: Array<typeof documents.$inferSelect>;
  processRows?: Array<typeof processes.$inferSelect>;
} = {}) {
  return {
    query: {
      documents: {
        findMany: async () => documentRows,
      },
      processes: {
        findMany: async () => processRows,
      },
    },
  } as unknown as FastifyInstance["db"];
}

test("getDocuments returns enriched items with processNumber and responsibles for admin", async () => {
  const result = await getDocuments({
    actor: { id: "admin_user", role: "admin", organizationId: null },
    db: createGetDocumentsDb(),
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].processNumber, "PROC-2026-001");
  assert.deepEqual(result.items[0].responsibles, ["Ana Souza"]);
  assert.equal(result.items[0].id, DOCUMENT_ID);
  assert.equal(result.items[0].type, "dfd");
  assert.equal(result.items[0].status, "generating");
});

test("getDocuments returns null processNumber when process is not found", async () => {
  const result = await getDocuments({
    actor: { id: "admin_user", role: "admin", organizationId: null },
    db: createGetDocumentsDb({ processRows: [] }),
  });

  assert.equal(result.items[0].processNumber, null);
});

test("getDocuments returns empty list for org-scoped actor without organizationId", async () => {
  const result = await getDocuments({
    actor: { id: "member_user", role: "member", organizationId: undefined as unknown as null },
    db: createGetDocumentsDb(),
  });

  assert.deepEqual(result.items, []);
});
