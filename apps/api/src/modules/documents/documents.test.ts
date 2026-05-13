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
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import {
  TextGenerationError,
  type TextGenerationProvider,
} from "../../shared/text-generation/types";
import { createDocument as createPendingDocument } from "./create-document";
import { createDocumentGenerationEvents } from "./document-generation-events";
import { executeDocumentGeneration } from "./document-generation-worker";
import {
  applyDocumentTextAdjustment,
  getDocumentContentHash,
  suggestDocumentTextAdjustment,
} from "./document-text-adjustment";
import { createDocumentBodySchema } from "./documents.schemas";
import { serializeDocumentDetail } from "./documents.shared";
import { getDocuments } from "./get-documents";
import {
  configureDocumentGenerationEventsStream,
  createDocumentGenerationEventsHeaders,
  writeSseComment,
  writeSseEvent,
} from "./routes";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const OTHER_ORGANIZATION_ID = "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
const DEPARTMENT_ID = "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733";
const DOCUMENT_ID = "7a7a7a7a-e2e5-4876-b4c3-b35306c6e733";
const GENERATION_RUN_ID = "6b6b6b6b-e2e5-4876-b4c3-b35306c6e733";

type TestDb = FastifyInstance["db"] & {
  getCurrentDocument(): typeof documents.$inferSelect;
  getCurrentGenerationRun(): typeof documentGenerationRuns.$inferSelect | null;
};

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
    procurementMethod: "pregao",
    biddingModality: "reverse_auction",
    processNumber: "PROC-2026-001",
    externalId: null,
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    title: "Materiais",
    object: "Aquisicao de materiais",
    justification: "Reposicao de estoque",
    responsibleName: "Ana Souza",
    responsibleUserId: "user_responsible",
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
  initialDocument = null,
}: {
  departments?: Array<typeof departmentsTable.$inferSelect>;
  organization?: typeof organizations.$inferSelect | null;
  processDepartmentIds?: string[];
  process?: typeof processes.$inferSelect | null;
  onDocumentInsert?: (values: Record<string, unknown>) => void;
  onDocumentUpdate?: (values: Record<string, unknown>) => void;
  onGenerationRunUpdate?: (values: Record<string, unknown>) => void;
  initialDocument?: typeof documents.$inferSelect | null;
} = {}) {
  let currentDocument: typeof documents.$inferSelect | null = initialDocument;
  let currentGenerationRun: typeof documentGenerationRuns.$inferSelect | null = null;

  const tx = {
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === documents) {
          onDocumentInsert?.(values);
          currentDocument = createDocumentRow(values);

          return {
            returning: async () => [currentDocument],
          };
        }

        assert.equal(table, documentGenerationRuns);
        currentGenerationRun = {
          id: GENERATION_RUN_ID,
          documentId: DOCUMENT_ID,
          providerKey: "stub",
          model: "stub-model",
          status: "generating",
          requestMetadata: {},
          responseMetadata: null,
          errorCode: null,
          errorMessage: null,
          errorDetails: null,
          startedAt: new Date("2029-12-01T00:00:00.000Z"),
          finishedAt: null,
          createdAt: new Date("2029-12-01T00:00:00.000Z"),
          ...values,
        } as typeof documentGenerationRuns.$inferSelect;

        return {
          returning: async () => [currentGenerationRun],
        };
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: () => {
          if (table === documents) {
            onDocumentUpdate?.(values);
            currentDocument = createDocumentRow({
              ...(currentDocument ?? createDocumentRow()),
              ...values,
            });

            return {
              returning: async () => [currentDocument],
            };
          }

          assert.equal(table, documentGenerationRuns);
          onGenerationRunUpdate?.(values);
          currentGenerationRun = {
            ...(currentGenerationRun ?? {
              id: GENERATION_RUN_ID,
              documentId: DOCUMENT_ID,
              providerKey: "stub",
              model: "stub-model",
              status: "generating",
              requestMetadata: {},
              responseMetadata: null,
              errorCode: null,
              errorMessage: null,
              errorDetails: null,
              startedAt: new Date("2029-12-01T00:00:00.000Z"),
              finishedAt: null,
              createdAt: new Date("2029-12-01T00:00:00.000Z"),
            }),
            ...values,
          } as typeof documentGenerationRuns.$inferSelect;

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
      documentGenerationRuns: {
        findFirst: async () => currentGenerationRun,
        findMany: async () => (currentGenerationRun ? [currentGenerationRun] : []),
      },
      documents: {
        findFirst: async () => currentDocument,
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
    update: tx.update,
    getCurrentDocument: () => {
      assert.ok(currentDocument);
      return currentDocument;
    },
    getCurrentGenerationRun: () => currentGenerationRun,
  } as unknown as TestDb;
}

async function createDocument(
  input: Parameters<typeof createPendingDocument>[0] & {
    db: TestDb;
    textGeneration: TextGenerationProvider;
  },
) {
  await createPendingDocument(input);
  const generationRun = input.db.getCurrentGenerationRun();
  assert.ok(generationRun);

  await executeDocumentGeneration({
    db: input.db,
    generationRunId: generationRun.id,
    textGeneration: input.textGeneration,
  });

  return serializeDocumentDetail(input.db.getCurrentDocument());
}

test("createDocument returns a generating draft before provider completion", async () => {
  let insertedDocument: Record<string, unknown> | undefined;
  let scheduledGenerationRunId: string | undefined;
  let providerWasCalled = false;
  const db = createDb({
    onDocumentInsert: (values) => {
      insertedDocument = values;
    },
  });

  const response = await createPendingDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
      instructions: "Usar linguagem objetiva.",
    }),
    scheduleGeneration: (generationRunId) => {
      scheduledGenerationRunId = generationRunId;
    },
    textGeneration: createTextGenerationProvider(async () => {
      providerWasCalled = true;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: "Conteudo gerado do DFD",
        responseMetadata: {},
      };
    }),
  });

  const generationRun = db.getCurrentGenerationRun();

  assert.equal(insertedDocument?.status, "generating");
  assert.equal(response.status, "generating");
  assert.equal(response.draftContent, null);
  assert.equal(providerWasCalled, false);
  assert.equal(scheduledGenerationRunId, GENERATION_RUN_ID);
  assert.equal(generationRun?.status, "generating");
  assert.equal(generationRun?.requestMetadata.documentType, "dfd");
  assert.match(String(generationRun?.requestMetadata.prompt), /## Modelo Markdown canônico/);
});

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
  assert.match(receivedPrompt ?? "", /## Modelo Markdown canônico/);
  assert.match(receivedPrompt ?? "", /# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA \(DFD\)/);
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
          "# ESTUDO TÉCNICO PRELIMINAR (ETP)",
          "",
          "## 1. INTRODUÇÃO",
          "Conteudo gerado do ETP.",
          "",
          "## 5. ESTIMATIVA DO VALOR DA CONTRATAÇÃO",
          "O valor estimado dependerá de apuração complementar em etapa própria.",
        ].join("\n"),
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.match(receivedPrompt ?? "", /# ESTUDO TÉCNICO PRELIMINAR \(ETP\)/);
  assert.match(
    receivedPrompt ?? "",
    /- Perfil de análise inferido para o ETP: apresentacao_artistica/,
  );
  assert.match(receivedPrompt ?? "", /- Estimativa disponível: não/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /não simule pesquisa de mercado/i);
  assert.match(
    receivedPrompt ?? "",
    /perfil de análise inferido apenas para ajustar a ênfase técnica/i,
  );
  assert.match(receivedPrompt ?? "", /Preserve a consistência entre objeto, município, organização/);
  assert.match(receivedPrompt ?? "", /Não misture informações de DFD, TR, minuta/);
  assert.match(receivedPrompt ?? "", /Lei nº 14\.133\/2021 e a boas práticas do TCU/);
  assert.match(receivedPrompt ?? "", /Manter consistencia com o DFD\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.match(response.draftContent ?? "", /ESTIMATIVA DO VALOR DA CONTRATAÇÃO/);
  assert.match(response.draftContent ?? "", /apuração complementar/);
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
          "# TERMO DE REFERÊNCIA",
          "",
          "## 1. OBJETO",
          "Conteudo gerado do TR.",
          "",
          "## 7. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA",
          "Valor não informado no contexto; será apurado posteriormente por pesquisa de mercado.",
        ].join("\n"),
        responseMetadata: {
          finishReason: "stop",
        },
      };
    }),
  });

  assert.match(receivedPrompt ?? "", /# TERMO DE REFERÊNCIA/);
  assert.match(receivedPrompt ?? "", /- Tipo de documento: TR/);
  assert.match(
    receivedPrompt ?? "",
    /- Tipo de contratação inferido para obrigações: apresentacao_artistica/,
  );
  assert.match(receivedPrompt ?? "", /- Estimativa disponível: não/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(receivedPrompt ?? "", /não invente valores/i);
  assert.match(receivedPrompt ?? "", /Manter consistencia operacional com o ETP\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.match(response.draftContent ?? "", /VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(response.draftContent ?? "", /Valor não informado no contexto/);
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

test("suggestDocumentTextAdjustment sends selection context to provider without persisting", async () => {
  let receivedPrompt = "";
  let updatedDocument: Record<string, unknown> | undefined;
  const draftContent = [
    "# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)",
    "",
    "A contratação se faz necessária para atender à demanda apresentada.",
    "",
    "O documento mantém tom formal.",
  ].join("\n");
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
    onDocumentUpdate: (values) => {
      updatedDocument = values;
    },
  });

  const response = await suggestDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      selectedText: "A contratação se faz necessária para atender à demanda apresentada.",
      instruction: "Deixe mais objetivo.",
      selectionContext: {
        prefix: "# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)\n\n",
        suffix: "\n\nO documento mantém tom formal.",
      },
    },
    textGeneration: createTextGenerationProvider(async (input) => {
      receivedPrompt = input.prompt;

      return {
        providerKey: "stub",
        model: "stub-model",
        text: "A contratação é necessária para atender à demanda apresentada.",
        responseMetadata: {},
      };
    }),
  });

  assert.match(receivedPrompt, /Tipo de documento: DFD/);
  assert.match(receivedPrompt, /Deixe mais objetivo\./);
  assert.match(receivedPrompt, /A contratação se faz necessária/);
  assert.match(receivedPrompt, /Preserve o tom formal/);
  assert.equal(
    response.replacementText,
    "A contratação é necessária para atender à demanda apresentada.",
  );
  assert.equal(response.sourceContentHash, getDocumentContentHash(draftContent));
  const expectedSelectedText =
    "A contratação se faz necessária para atender à demanda apresentada.";
  const expectedStart = draftContent.indexOf(expectedSelectedText);
  assert.deepEqual(response.sourceTarget, {
    start: expectedStart,
    end: expectedStart + expectedSelectedText.length,
    sourceText: expectedSelectedText,
  });
  assert.equal(updatedDocument, undefined);
  assert.equal(db.getCurrentDocument().draftContent, draftContent);
});

test("suggestDocumentTextAdjustment rejects unauthorized and empty requests", async () => {
  let providerWasCalled = false;
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent: "Conteudo atual.",
    }),
  });
  const textGeneration = createTextGenerationProvider(async () => {
    providerWasCalled = true;

    return {
      providerKey: "stub",
      model: "stub-model",
      text: "Conteudo ajustado.",
      responseMetadata: {},
    };
  });

  await assert.rejects(
    () =>
      suggestDocumentTextAdjustment({
        actor: {
          id: "member_user",
          role: "member",
          organizationId: OTHER_ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: {
          selectedText: "Conteudo atual.",
          instruction: "Ajuste.",
        },
        textGeneration,
      }),
    ForbiddenError,
  );

  await assert.rejects(
    () =>
      suggestDocumentTextAdjustment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: {
          selectedText: "   ",
          instruction: "Ajuste.",
        },
        textGeneration,
      }),
    BadRequestError,
  );
  assert.equal(providerWasCalled, false);
});

test("applyDocumentTextAdjustment persists accepted replacement using resolved source target", async () => {
  let updatedDocument: Record<string, unknown> | undefined;
  const draftContent = "Texto inicial.\n\nTrecho para ajustar.\n\nTexto final.";
  const selectedText = "Trecho para ajustar.";
  const start = draftContent.indexOf(selectedText);
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
    onDocumentUpdate: (values) => {
      updatedDocument = values;
    },
  });

  const response = await applyDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      sourceTarget: { start, end: start + selectedText.length, sourceText: selectedText },
      replacementText: "Trecho ajustado com linguagem formal.",
      sourceContentHash: getDocumentContentHash(draftContent),
    },
  });

  assert.equal(
    updatedDocument?.draftContent,
    "Texto inicial.\n\nTrecho ajustado com linguagem formal.\n\nTexto final.",
  );
  assert.ok(updatedDocument?.updatedAt instanceof Date);
  assert.equal(response.draftContent, updatedDocument?.draftContent);
});

test("applyDocumentTextAdjustment rejects stale hash or mismatched sourceText without changing content", async () => {
  const draftContent = "Trecho correto.\n\nOutro texto.\n\nFim do documento.";
  const selectedText = "Trecho correto.";
  const start = draftContent.indexOf(selectedText);
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
  });

  // Stale hash: sourceTarget is valid but hash is outdated
  await assert.rejects(
    () =>
      applyDocumentTextAdjustment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: {
          sourceTarget: { start, end: start + selectedText.length, sourceText: selectedText },
          replacementText: "Trecho ajustado.",
          sourceContentHash: "sha256:stale",
        },
      }),
    ConflictError,
  );
  assert.equal(db.getCurrentDocument().draftContent, draftContent);

  // Mismatched sourceText: hash is current but sourceText does not match content at those offsets
  await assert.rejects(
    () =>
      applyDocumentTextAdjustment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: {
          sourceTarget: { start, end: start + selectedText.length, sourceText: "Texto diferente." },
          replacementText: "Trecho ajustado.",
          sourceContentHash: getDocumentContentHash(draftContent),
        },
      }),
    ConflictError,
  );
  assert.equal(db.getCurrentDocument().draftContent, draftContent);
});

test("suggestDocumentTextAdjustment resolves rendered list-field selection via markdown-aware fallback", async () => {
  let updateCallCount = 0;
  let lastUpdatedDocument: Record<string, unknown> | undefined;
  const draftContent = [
    "## 1. DADOS DA SOLICITACAO",
    "",
    "- Campo: Valor do campo administrativo",
    "",
    "Texto de encerramento.",
  ].join("\n");
  const renderedSelection = "Valor do campo administrativo";
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
    onDocumentUpdate: (values) => {
      updateCallCount += 1;
      lastUpdatedDocument = values;
    },
  });

  const suggestion = await suggestDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      selectedText: renderedSelection,
      instruction: "Deixe mais formal.",
    },
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: "Valor do campo administrativo formal",
      responseMetadata: {},
    })),
  });

  const expectedSourceStart = draftContent.indexOf(renderedSelection);
  assert.equal(suggestion.sourceTarget.sourceText, renderedSelection);
  assert.equal(suggestion.sourceTarget.start, expectedSourceStart);
  assert.equal(suggestion.sourceTarget.end, expectedSourceStart + renderedSelection.length);
  assert.equal(updateCallCount, 0, "suggestion must not persist any update");

  const applyResponse = await applyDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      sourceTarget: suggestion.sourceTarget,
      replacementText: suggestion.replacementText,
      sourceContentHash: suggestion.sourceContentHash,
    },
  });

  if (!lastUpdatedDocument) {
    throw new Error("Expected document to be updated by applyDocumentTextAdjustment");
  }
  assert.ok(
    String(lastUpdatedDocument.draftContent).includes("Valor do campo administrativo formal"),
  );
  assert.equal(applyResponse.draftContent, lastUpdatedDocument.draftContent);
});

test("suggestDocumentTextAdjustment resolves wrapped rendered paragraph selections", async () => {
  let updateCallCount = 0;
  let lastUpdatedDocument: Record<string, unknown> | undefined;
  const sourceText = [
    "O objeto da contratação consiste na prestação de serviço de",
    "apresentação artística musical da banda FORRÓ TSUNAMI, em uma única execução.",
  ].join("\n");
  const draftContent = ["## 3. OBJETO DA CONTRATAÇÃO", "", sourceText, "", "Texto final."].join(
    "\n",
  );
  const renderedSelection =
    "O objeto da contratação consiste na prestação de serviço de apresentação artística musi-\ncal da banda FORRÓ TSUNAMI, em uma única execução.";
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
    onDocumentUpdate: (values) => {
      updateCallCount += 1;
      lastUpdatedDocument = values;
    },
  });

  const suggestion = await suggestDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      selectedText: renderedSelection,
      instruction: "Deixe mais direto.",
    },
    textGeneration: createTextGenerationProvider(async () => ({
      providerKey: "stub",
      model: "stub-model",
      text: "O objeto consiste na apresentação artística musical da banda FORRÓ TSUNAMI.",
      responseMetadata: {},
    })),
  });

  const expectedSourceStart = draftContent.indexOf(sourceText);
  assert.equal(suggestion.sourceTarget.sourceText, sourceText);
  assert.equal(suggestion.sourceTarget.start, expectedSourceStart);
  assert.equal(suggestion.sourceTarget.end, expectedSourceStart + sourceText.length);
  assert.equal(updateCallCount, 0, "suggestion must not persist any update");

  const applyResponse = await applyDocumentTextAdjustment({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: ORGANIZATION_ID,
    },
    db,
    documentId: DOCUMENT_ID,
    input: {
      sourceTarget: suggestion.sourceTarget,
      replacementText: suggestion.replacementText,
      sourceContentHash: suggestion.sourceContentHash,
    },
  });

  if (!lastUpdatedDocument) {
    throw new Error("Expected document to be updated by applyDocumentTextAdjustment");
  }
  assert.ok(String(lastUpdatedDocument.draftContent).includes(suggestion.replacementText));
  assert.equal(applyResponse.draftContent, lastUpdatedDocument.draftContent);
});

test("suggestDocumentTextAdjustment rejects ambiguous and unresolvable selections without calling provider", async () => {
  let providerCallCount = 0;
  const draftContent = "Trecho repetido aqui.\n\nOutro conteudo.\n\nTrecho repetido aqui.\n\nFim.";
  const db = createDb({
    initialDocument: createDocumentRow({
      status: "completed",
      draftContent,
    }),
  });
  const textGeneration = createTextGenerationProvider(async () => {
    providerCallCount += 1;
    return {
      providerKey: "stub",
      model: "stub-model",
      text: "Sugestao.",
      responseMetadata: {},
    };
  });

  // Ambiguous: selectedText appears more than once in the source
  await assert.rejects(
    () =>
      suggestDocumentTextAdjustment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: { selectedText: "Trecho repetido aqui.", instruction: "Ajuste." },
        textGeneration,
      }),
    ConflictError,
  );
  assert.equal(providerCallCount, 0, "provider must not be called for ambiguous selection");

  // Unresolvable: selectedText is not present in source or markdown-rendered view
  await assert.rejects(
    () =>
      suggestDocumentTextAdjustment({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: ORGANIZATION_ID,
        },
        db,
        documentId: DOCUMENT_ID,
        input: { selectedText: "Trecho inexistente no documento.", instruction: "Ajuste." },
        textGeneration,
      }),
    ConflictError,
  );
  assert.equal(providerCallCount, 0, "provider must not be called for unresolvable selection");
  assert.equal(db.getCurrentDocument().draftContent, draftContent);
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

test("document generation events publish snapshots and clean up subscribers", () => {
  const events = createDocumentGenerationEvents();
  const received: unknown[] = [];
  const unsubscribe = events.subscribe(DOCUMENT_ID, (event) => {
    received.push(event);
  });

  events.publishChunk({ documentId: DOCUMENT_ID, textDelta: "Parte 1" });
  events.publishPlanning({ documentId: DOCUMENT_ID, planningDelta: "Analisando processo" });
  events.publishChunk({ documentId: DOCUMENT_ID, textDelta: " e parte 2" });
  unsubscribe();
  events.publishCompleted({ documentId: DOCUMENT_ID, content: "Conteudo final" });

  assert.equal(received.length, 3);
  assert.deepEqual(
    received.map((event) =>
      event && typeof event === "object" && "sequence" in event ? event.sequence : null,
    ),
    [1, 2, 3],
  );
  assert.match(
    typeof received[0] === "object" &&
      received[0] !== null &&
      "publishedAt" in received[0] &&
      typeof received[0].publishedAt === "string"
      ? received[0].publishedAt
      : "",
    /^\d{4}-\d{2}-\d{2}T/,
  );
  assert.deepEqual(events.getSnapshot(DOCUMENT_ID), {
    type: "completed",
    documentId: DOCUMENT_ID,
    content: "Conteudo final",
    status: "completed",
    sequence: 4,
    publishedAt: events.getSnapshot(DOCUMENT_ID)?.publishedAt,
  });
});

test("document generation events keep planning snapshots separate from document content", () => {
  const events = createDocumentGenerationEvents();

  events.publishPlanning({ documentId: DOCUMENT_ID, planningDelta: "Analisando " });
  events.publishPlanning({ documentId: DOCUMENT_ID, planningDelta: "processo" });
  events.publishChunk({ documentId: DOCUMENT_ID, textDelta: "Documento " });
  events.publishChunk({ documentId: DOCUMENT_ID, textDelta: "final" });

  assert.deepEqual(events.getSnapshots(DOCUMENT_ID), [
    {
      type: "planning",
      documentId: DOCUMENT_ID,
      planningDelta: "processo",
      planningContent: "Analisando processo",
      status: "generating",
      sequence: 2,
      publishedAt: events.getSnapshots(DOCUMENT_ID)[0]?.publishedAt,
    },
    {
      type: "chunk",
      documentId: DOCUMENT_ID,
      textDelta: "final",
      content: "Documento final",
      status: "generating",
      sequence: 4,
      publishedAt: events.getSnapshots(DOCUMENT_ID)[1]?.publishedAt,
    },
  ]);
});

test("document generation events SSE headers allow configured browser origin with credentials", () => {
  const headers = createDocumentGenerationEventsHeaders({
    corsOrigin: "http://localhost:5173, https://app.licitadoc.test",
    requestOrigin: "http://localhost:5173",
  });

  assert.equal(headers["access-control-allow-origin"], "http://localhost:5173");
  assert.equal(headers["access-control-allow-credentials"], "true");
  assert.equal(headers.vary, "Origin");
  assert.equal(headers["content-type"], "text/event-stream; charset=utf-8");
  assert.equal(headers["cache-control"], "no-cache, no-transform");
  assert.equal(headers["x-accel-buffering"], "no");
});

test("document generation events SSE headers do not allow unconfigured browser origin", () => {
  const headers = createDocumentGenerationEventsHeaders({
    corsOrigin: "http://localhost:5173",
    requestOrigin: "https://untrusted.licitadoc.test",
  });

  assert.equal(headers["access-control-allow-origin"], undefined);
  assert.equal(headers["access-control-allow-credentials"], undefined);
  assert.equal(headers.vary, undefined);
  assert.equal(headers["content-type"], "text/event-stream; charset=utf-8");
  assert.equal(headers["cache-control"], "no-cache, no-transform");
  assert.equal(headers["x-accel-buffering"], "no");
});

test("document generation SSE stream config flushes headers and disables socket delay", () => {
  let flushedHeaders = false;
  let socketNoDelay: boolean | undefined;

  configureDocumentGenerationEventsStream({
    write() {
      return true;
    },
    flushHeaders() {
      flushedHeaders = true;
    },
    socket: {
      setNoDelay(noDelay) {
        socketNoDelay = noDelay;
      },
    },
  });

  assert.equal(flushedHeaders, true);
  assert.equal(socketNoDelay, true);
});

test("document generation SSE events are written as complete flushed frames", () => {
  const writes: string[] = [];
  let flushCount = 0;

  writeSseEvent(
    {
      write(chunk) {
        writes.push(String(chunk));
        return true;
      },
      flush() {
        flushCount += 1;
      },
    },
    {
      type: "chunk",
      documentId: DOCUMENT_ID,
      textDelta: "Conteudo ",
      content: "Conteudo ",
      status: "generating",
      sequence: 1,
      publishedAt: "2026-05-06T14:00:00.000Z",
    },
    {
      now: () => new Date("2026-05-06T14:00:01.000Z"),
    },
  );

  assert.equal(writes.length, 1);
  assert.equal(flushCount, 1);
  assert.equal(
    writes[0],
    'event: chunk\ndata: {"type":"chunk","documentId":"7a7a7a7a-e2e5-4876-b4c3-b35306c6e733","textDelta":"Conteudo ","content":"Conteudo ","status":"generating","sequence":1,"publishedAt":"2026-05-06T14:00:00.000Z","serverSentAt":"2026-05-06T14:00:01.000Z"}\n\n',
  );
});

test("document generation SSE comments are flushed", () => {
  const writes: string[] = [];
  let flushCount = 0;

  writeSseComment(
    {
      write(chunk) {
        writes.push(String(chunk));
        return true;
      },
      flush() {
        flushCount += 1;
      },
    },
    "keep-alive",
  );

  assert.deepEqual(writes, [": keep-alive\n\n"]);
  assert.equal(flushCount, 1);
});

test("executeDocumentGeneration publishes chunk and completion events", async () => {
  const db = createDb();
  const events = createDocumentGenerationEvents();
  const received: unknown[] = [];

  await createPendingDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
    }),
  });

  events.subscribe(DOCUMENT_ID, (event) => {
    received.push(event);
  });

  const generationRun = db.getCurrentGenerationRun();
  assert.ok(generationRun);

  await executeDocumentGeneration({
    db,
    generationEvents: events,
    generationRunId: generationRun.id,
    textGeneration: createTextGenerationProvider(async (input) => {
      await input.onPlanningChunk?.({
        planningDelta: "Analisando dados",
        metadata: { index: 0 },
      });
      await input.onChunk?.({ textDelta: "Conteudo ", metadata: { index: 1 } });
      await input.onChunk?.({ textDelta: "gerado", metadata: { index: 2 } });

      return {
        providerKey: "stub",
        model: "stub-model",
        text: "Conteudo gerado",
        responseMetadata: {},
      };
    }),
  });

  assert.equal(received.length, 4);
  assert.deepEqual(
    received.map((event) =>
      event && typeof event === "object" && "sequence" in event ? event.sequence : null,
    ),
    [1, 2, 3, 4],
  );
  assert.deepEqual(received, [
    {
      type: "planning",
      documentId: DOCUMENT_ID,
      planningDelta: "Analisando dados",
      planningContent: "Analisando dados",
      status: "generating",
      sequence: 1,
      publishedAt:
        typeof received[0] === "object" && received[0] !== null && "publishedAt" in received[0]
          ? received[0].publishedAt
          : "",
    },
    {
      type: "chunk",
      documentId: DOCUMENT_ID,
      textDelta: "Conteudo ",
      content: "Conteudo ",
      status: "generating",
      sequence: 2,
      publishedAt:
        typeof received[1] === "object" && received[1] !== null && "publishedAt" in received[1]
          ? received[1].publishedAt
          : "",
    },
    {
      type: "chunk",
      documentId: DOCUMENT_ID,
      textDelta: "gerado",
      content: "Conteudo gerado",
      status: "generating",
      sequence: 3,
      publishedAt:
        typeof received[2] === "object" && received[2] !== null && "publishedAt" in received[2]
          ? received[2].publishedAt
          : "",
    },
    {
      type: "completed",
      documentId: DOCUMENT_ID,
      content: "Conteudo gerado",
      status: "completed",
      sequence: 4,
      publishedAt:
        typeof received[3] === "object" && received[3] !== null && "publishedAt" in received[3]
          ? received[3].publishedAt
          : "",
    },
  ]);
});

test("executeDocumentGeneration publishes failure events", async () => {
  const db = createDb();
  const events = createDocumentGenerationEvents();
  const received: unknown[] = [];

  await createPendingDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
    }),
  });

  events.subscribe(DOCUMENT_ID, (event) => {
    received.push(event);
  });

  const generationRun = db.getCurrentGenerationRun();
  assert.ok(generationRun);

  await executeDocumentGeneration({
    db,
    generationEvents: events,
    generationRunId: generationRun.id,
    textGeneration: createTextGenerationProvider(async () => {
      throw new TextGenerationError({
        code: "provider_unavailable",
        message: "Provider unavailable.",
        providerKey: "stub",
        model: "stub-model",
      });
    }),
  });

  assert.deepEqual(received, [
    {
      type: "failed",
      documentId: DOCUMENT_ID,
      errorCode: "provider_unavailable",
      errorMessage: "Provider unavailable.",
      status: "failed",
      sequence: 1,
      publishedAt:
        typeof received[0] === "object" && received[0] !== null && "publishedAt" in received[0]
          ? received[0].publishedAt
          : "",
    },
  ]);
});

test("executeDocumentGeneration skips runs that are no longer pending", async () => {
  let callCount = 0;
  const db = createDb();
  const textGeneration = createTextGenerationProvider(async () => {
    callCount += 1;

    return {
      providerKey: "stub",
      model: "stub-model",
      text: "Conteudo gerado",
      responseMetadata: {},
    };
  });

  await createPendingDocument({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    document: createDocumentBodySchema.parse({
      processId: PROCESS_ID,
      documentType: "dfd",
    }),
  });

  const generationRun = db.getCurrentGenerationRun();
  assert.ok(generationRun);

  await executeDocumentGeneration({
    db,
    generationRunId: generationRun.id,
    textGeneration,
  });
  await executeDocumentGeneration({
    db,
    generationRunId: generationRun.id,
    textGeneration,
  });

  assert.equal(callCount, 1);
  assert.equal(db.getCurrentDocument().status, "completed");
  assert.equal(db.getCurrentGenerationRun()?.status, "completed");
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
  assert.equal(/ESTUDO TÉCNICO PRELIMINAR/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(response.draftContent ?? ""), false);
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
      "Valor não informado.",
    ].join("\n"),
  );
  assert.equal(/DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(response.draftContent ?? ""), false);
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
        "# ESTUDO TÉCNICO PRELIMINAR (ETP)",
        "",
        "## 1. INTRODUÇÃO",
        "Conteudo ETP valido.",
      ].join("\n"),
      responseMetadata: {},
    })),
  });

  assert.match(response.draftContent ?? "", /## 5\. ESTIMATIVA DO VALOR DA CONTRATAÇÃO/);
  assert.match(response.draftContent ?? "", /apuração complementar em etapa própria/);
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
      "Valor não informado.",
    ].join("\n"),
  );
  assert.equal(/DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/ESTUDO TÉCNICO PRELIMINAR/i.test(response.draftContent ?? ""), false);
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
      text: ["# TERMO DE REFERÊNCIA", "", "## 1. OBJETO", "Conteudo TR valido."].join("\n"),
      responseMetadata: {},
    })),
  });

  assert.match(response.draftContent ?? "", /## 7\. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA/);
  assert.match(response.draftContent ?? "", /pesquisa de mercado ou etapa própria/);
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
    /- Tipo de contratação inferido para obrigações: apresentacao_artistica/,
  );
  assert.match(receivedPrompt ?? "", /- Preço disponível: não/);
  assert.match(receivedPrompt ?? "", /- Valor bruto extraído da origem: R\$ 0,00/);
  assert.match(receivedPrompt ?? "", /- Valor a usar na cláusula DO PREÇO: R\$ XX\.XXX,XX/);
  assert.match(receivedPrompt ?? "", /Use prioritariamente o bloco Tipo: apresentacao_artistica/);
  assert.match(receivedPrompt ?? "", /Cláusulas FIXED do template:/);
  assert.match(receivedPrompt ?? "", /Manter consistencia contratual com o TR\./);
  assert.equal(updatedDocument?.status, "completed");
  assert.equal(updatedDocument?.draftContent, response.draftContent);
  assert.equal(/DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA/i.test(response.draftContent ?? ""), false);
  assert.equal(/TERMO DE REFERÊNCIA/i.test(response.draftContent ?? ""), false);
  assert.equal(/R\$ 0,00/i.test(response.draftContent ?? ""), false);
  assert.equal(/Texto reescrito indevidamente/i.test(response.draftContent ?? ""), false);
  assert.match(response.draftContent ?? "", /R\$ XX\.XXX,XX/);
  assert.match(
    response.draftContent ?? "",
    /13\.1\. A CONTRATADA reconhece os direitos da CONTRATANTE relativos ao presente contrato/,
  );
  assert.match(response.draftContent ?? "", /## CLÁUSULA DÉCIMA OITAVA - DO FORO/);
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

  assert.match(response.draftContent ?? "", /## CLÁUSULA SEGUNDA - DO PREÇO/);
  assert.match(response.draftContent ?? "", /R\$ XX\.XXX,XX/);
  assert.match(response.draftContent ?? "", /## CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS/);
  assert.match(response.draftContent ?? "", /## CLÁUSULA DÉCIMA OITAVA - DO FORO/);
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
