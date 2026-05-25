import assert from "node:assert/strict";
import { test } from "vitest";
import type { departments, organizations, processes } from "../../db";
import type {
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
} from "../../shared/text-generation/types";
import { TextGenerationError } from "../../shared/text-generation/types";
import type { SerializedProcessItem } from "../processes/processes.shared";
import {
  createInitialDocumentGenerationPipeline,
  deriveWriterStyle,
  executeDocumentGenerationPipeline,
  extractDocumentGenerationFacts,
  normalizePipelineMoneyValue,
  reviewGeneratedDocumentDraft,
} from "./document-generation-pipeline";

const ORGANIZATION_ID = "4fd5b7df-e2e5-4876-b4c3-b35306c6e733";
const PROCESS_ID = "1f1f1f1f-e2e5-4876-b4c3-b35306c6e733";
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
    city: "Fortaleza",
    state: "CE",
    address: "Rua Principal, 100",
    zipCode: "60000-000",
    phone: "(85) 3333-0000",
    institutionalEmail: "contato@exemplo.ce.gov.br",
    website: null,
    logoUrl: null,
    crestUrl: null,
    letterheadUrl: null,
    letterheadTemplateUrl: null,
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
    id: "9f9f9f9f-e2e5-4876-b4c3-b35306c6e733",
    organizationId: ORGANIZATION_ID,
    name: "Secretaria Municipal de Administracao",
    slug: "secretaria-municipal-de-administracao",
    budgetUnitCode: "06.001",
    responsibleName: "Ana Souza",
    responsibleRole: "Secretaria Municipal",
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
    type: "processo",
    procurementMethod: null,
    biddingModality: null,
    processNumber: "PROC-2026-001",
    externalId: "SD-6-2026",
    issuedAt: new Date("2026-01-08T00:00:00.000Z"),
    title: "Demanda",
    object: "Aquisicao de materiais",
    justification: "Atender demanda administrativa.",
    responsibleName: "Ana Souza",
    responsibleUserId: null,
    status: "draft",
    sourceKind: "expense_request",
    sourceReference: "SD-6-2026",
    sourceMetadata: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildPipeline({
  documentType = "etp",
  process,
  processItems = [],
}: {
  documentType?: "dfd" | "etp" | "tr" | "minuta";
  process: typeof processes.$inferSelect;
  processItems?: SerializedProcessItem[];
}) {
  return createInitialDocumentGenerationPipeline({
    debugRequested: true,
    departments: [createDepartmentRow()],
    documentType,
    instructions: null,
    organization: createOrganizationRow(),
    process,
    processItems,
    responsibleUserName: null,
  });
}

function createProvider(
  generateText: (input: TextGenerationInput, callIndex: number) => Promise<TextGenerationResult>,
): TextGenerationProvider & { calls: TextGenerationInput[] } {
  const calls: TextGenerationInput[] = [];

  return {
    calls,
    model: "stub-model",
    providerKey: "stub",
    async generateText(input) {
      calls.push(input);

      return generateText(input, calls.length);
    },
  };
}

test("normalizePipelineMoneyValue treats zero-like values as missing estimates", () => {
  for (const value of [0, "0", "0,00", "0.00", "R$ 0,00"]) {
    const normalized = normalizePipelineMoneyValue(value);

    assert.equal(normalized.amount, null);
    assert.equal(normalized.hasValidValue, false);
  }

  assert.equal(normalizePipelineMoneyValue("R$ 1.234,56").amount, 1234.56);
  assert.equal(normalizePipelineMoneyValue("2500.00").amount, 2500);
});

test("extractDocumentGenerationFacts extracts literal data without semantic inference", () => {
  const facts = extractDocumentGenerationFacts({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes",
      sourceMetadata: {
        extractedFields: {
          estimatedValue: "R$ 0,00",
          items: [
            {
              description: "Kit Dia das Maes",
              quantity: "100",
              unit: "UN",
              unitValue: "R$ 0,00",
              totalValue: "R$ 0,00",
            },
          ],
          requestNumber: "6",
        },
      },
    }),
    processItems: [],
  });

  assert.equal(facts.originalObject, "Aquisicao de kits Dia das Maes");
  assert.equal(facts.hasValidEstimatedValue, false);
  assert.equal(facts.estimatedValue, null);
  assert.equal(facts.items[0]?.description, "Kit Dia das Maes");
  assert.equal("classification" in facts, false);
  assert.equal("risks" in facts, false);
  assert.equal("alternatives" in facts, false);
});

test("context enrichment classifies acceptance-profile SDs before planning", () => {
  const rh = buildPipeline({
    process: createProcessRow({
      object: "Contratacao de assessoria tecnica em recursos humanos com execucao mensal",
      justification: "Apoiar rotinas recorrentes de RH, folha e orientacao administrativa.",
    }),
  }).pipeline.enrichedContext;
  const kits = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      justification: "Realizar acao institucional e social em data comemorativa.",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "300", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  }).pipeline.enrichedContext;
  const artistic = buildPipeline({
    process: createProcessRow({
      object: "Contratacao de apresentacao artistica musical para festa cultural",
      justification: "Atender calendario cultural do municipio em data definida.",
    }),
  }).pipeline.enrichedContext;
  const simple = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao simples de papel A4",
      justification: "Reposicao de estoque administrativo.",
    }),
  }).pipeline.enrichedContext;

  assert.equal(rh.classification.procurementType, "technical_service");
  assert.equal(rh.classification.operationalNature, "continuous");
  assert.equal(rh.classification.executionComplexity, "high");
  assert.match(rh.recommendedTone, /tecnico-operacional/);

  assert.equal(kits.classification.procurementType, "social_action");
  assert.equal(kits.classification.operationalNature, "seasonal");
  assert.equal(kits.classification.publicInterestProfile, "social");
  assert.ok(kits.pendingIssues.some((issue) => issue.key === "distribution_criteria"));

  assert.equal(artistic.classification.procurementType, "event");
  assert.equal(artistic.classification.operationalNature, "seasonal");
  assert.ok(artistic.risks.some((risk) => /Perda de utilidade/.test(risk.risk)));

  assert.equal(simple.classification.procurementType, "goods");
  assert.equal(simple.classification.executionComplexity, "low");
  assert.equal(simple.documentPlans.ETP.recommendedDepth, "simplified");
});

test("context enrichment treats Dia das Maes distribution as social institutional acquisition", () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object:
        "Contratação de empresa para aquisição de materiais para distribuição gratuita em comemoração ao Dia das Mães na cidade de Pureza/RN.",
      justification:
        "Aquisição de materiais destinados à distribuição gratuita em ação institucional de caráter social, cultural e comunitário.",
      sourceMetadata: {
        extractedFields: {
          items: [
            {
              code: "0005909",
              description: "Pote plástico com tampa e trava lateral",
              quantity: "550",
              totalValue: "0,00",
              unit: "UN",
              unitValue: "0,00",
            },
            {
              code: "0005910",
              description: "Kit com 2 unidades de potes plásticos",
              quantity: "550",
              totalValue: "0,00",
              unit: "KIT",
              unitValue: "0,00",
            },
          ],
          totalValue: "0,00",
        },
      },
    }),
  });
  const context = pipeline.enrichedContext;

  assert.equal(context.classification.procurementType, "social_action");
  assert.equal(context.classification.operationalNature, "seasonal");
  assert.equal(context.classification.publicInterestProfile, "social");
  assert.notEqual(context.classification.operationalNature, "continuous");
  assert.equal(context.facts.hasValidEstimatedValue, false);
  assert.ok(context.pendingIssues.some((issue) => issue.key === "distribution_criteria"));
  assert.ok(context.risks.some((risk) => risk.risk === "Controle insuficiente de distribuicao"));
  assert.ok(context.documentPlans.ETP.focusAreas.includes("criterio de distribuicao"));
  assert.ok(context.documentPlans.TR.focusAreas.includes("controle de entrega"));
  assert.match(pipeline.prompt, /público-alvo, registre público e critério de distribuição/i);
  assert.match(pipeline.prompt, /não invente beneficiários/i);
});

test("initial pipeline embeds the strict sd-document-intelligence contract", () => {
  const { debug, pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });

  assert.equal(pipeline.skillContract.name, "sd-document-intelligence");
  assert.equal(debug.skillContract.contractDigest, pipeline.skillContract.contractDigest);
  assert.match(pipeline.prompt, /Contrato runtime obrigatório: sd-document-intelligence/);
  assert.match(pipeline.prompt, /Nenhuma inferência antes da classificação semântica/);
  assert.match(pipeline.prompt, /Trate valores `0`, `0,00`, `0\.00` ou `R\$ 0,00`/);
  assert.match(pipeline.prompt, /Documento final/);
});

test("document planning keeps DFD, ETP, TR, and Minuta roles distinct", () => {
  const context = buildPipeline({
    process: createProcessRow({
      object: "Contratacao de assessoria tecnica em recursos humanos com execucao mensal",
      justification: "Apoiar rotinas recorrentes de RH.",
    }),
  }).pipeline.enrichedContext;

  assert.equal(context.documentPlans.DFD.recommendedDepth, "simplified");
  assert.ok(context.documentPlans.DFD.avoid.includes("estudo de mercado"));
  assert.ok(context.documentPlans.ETP.focusAreas.includes("alternativas"));
  assert.ok(context.documentPlans.TR.focusAreas.includes("recebimento"));
  assert.ok(context.documentPlans.MINUTA.focusAreas.includes("clausulas contratuais"));
  assert.ok(context.documentPlans.MINUTA.avoid.includes("estudo tecnico"));
});

test("writer style derivation follows document type and semantic classification", () => {
  const rhContext = buildPipeline({
    process: createProcessRow({
      object: "Contratacao de assessoria tecnica em recursos humanos com execucao mensal",
      justification: "Apoiar rotinas recorrentes de RH.",
    }),
  }).pipeline.enrichedContext;
  const socialContext = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      justification: "Realizar acao institucional e social.",
    }),
  }).pipeline.enrichedContext;
  const simpleContext = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao simples de papel A4",
      justification: "Reposicao de estoque administrativo.",
    }),
  }).pipeline.enrichedContext;

  assert.equal(
    deriveWriterStyle({ classification: rhContext.classification, documentType: "etp" }),
    "technical",
  );
  assert.equal(
    deriveWriterStyle({ classification: socialContext.classification, documentType: "etp" }),
    "institutional",
  );
  assert.equal(
    deriveWriterStyle({ classification: simpleContext.classification, documentType: "etp" }),
    "administrative",
  );
  assert.equal(
    deriveWriterStyle({ classification: simpleContext.classification, documentType: "dfd" }),
    "administrative",
  );
  assert.equal(
    deriveWriterStyle({ classification: simpleContext.classification, documentType: "tr" }),
    "operational",
  );
  assert.equal(
    deriveWriterStyle({ classification: simpleContext.classification, documentType: "minuta" }),
    "dry_legal",
  );
});

test("reviewGeneratedDocumentDraft flags meta-language and excessive defensiveness", () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });
  const review = reviewGeneratedDocumentDraft({
    context: pipeline.enrichedContext,
    documentType: "etp",
    draft: [
      "# ESTUDO TÉCNICO PRELIMINAR",
      "",
      "Na ausência de contexto, o documento deverá ser confirmado pela unidade competente.",
      "O contexto não apresenta dados orçamentários, quando informado poderá ser complementado.",
      "A solução poderá ser adotada desde que deverá ser confirmado o detalhamento posterior.",
    ].join("\n"),
    plan: pipeline.documentPlan,
    writerStyle: pipeline.writerStyle,
  });

  assert.equal(review.status, "needs_revision");
  assert.ok(review.issues.some((issue) => issue.type === "meta_language"));
  assert.ok(review.issues.some((issue) => issue.type === "excessive_defensiveness"));
});

test("reviewGeneratedDocumentDraft flags duplicated Minuta fixed clauses and premature signatures", () => {
  const { pipeline } = buildPipeline({
    documentType: "minuta",
    process: createProcessRow({
      object: "Contratacao de assessoria tecnica em recursos humanos",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Assessoria tecnica em RH", quantity: "12", unit: "MES" }],
        },
      },
    }),
  });
  const review = reviewGeneratedDocumentDraft({
    context: pipeline.enrichedContext,
    documentType: "minuta",
    draft: [
      "# MINUTA DO CONTRATO",
      "",
      "## CLÁUSULA PRIMEIRA - DO OBJETO",
      "",
      "Contratação de assessoria técnica em recursos humanos.",
      "",
      "## CLÁUSULA DÉCIMA TERCEIRA - DAS ALTERAÇÕES",
      "",
      "13.1. O contrato poderá ser alterado nos casos previstos na Lei n. 14.133/2021.",
      "",
      "## CLÁUSULA DÉCIMA QUARTA - DA PUBLICAÇÃO",
      "",
      "14.1. A CONTRATANTE providenciará a publicação do extrato.",
      "",
      "E, por estarem de acordo, as partes assinam o presente instrumento.",
      "",
      "Pureza/RN, [DATA].",
      "",
      "__________________________________ CONTRATANTE",
      "",
      "## CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE",
      "",
      "14.1. Este instrumento poderá ser alterado nas hipóteses legais.",
      "",
      "## CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE",
      "",
      "16.1. Caberá à CONTRATANTE providenciar a publicidade do extrato.",
    ].join("\n"),
    plan: pipeline.documentPlan,
    writerStyle: pipeline.writerStyle,
  });

  assert.equal(review.status, "needs_revision");
  assert.ok(
    review.issues.some(
      (issue) =>
        issue.type === "template_violation" &&
        /cláusulas equivalentes duplicadas/i.test(issue.problem),
    ),
  );
  assert.ok(review.issues.some((issue) => issue.type === "signature_problem"));
});

test("reviewGeneratedDocumentDraft rejects invented positive values when estimate is missing", () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao simples de papel A4",
      sourceMetadata: {
        extractedFields: {
          totalValue: "0,00",
        },
      },
    }),
  });
  const review = reviewGeneratedDocumentDraft({
    context: pipeline.enrichedContext,
    documentType: "etp",
    draft: "# ESTUDO TÉCNICO PRELIMINAR\n\nValor estimado da contratação: R$ 12.000,00.",
    plan: pipeline.documentPlan,
    writerStyle: pipeline.writerStyle,
  });

  assert.equal(review.status, "needs_revision");
  assert.ok(review.issues.some((issue) => issue.type === "invalid_value_handling"));
});

test("reviewGeneratedDocumentDraft validates the runtime skill contract stage order", () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao simples de papel A4",
    }),
  });
  const review = reviewGeneratedDocumentDraft({
    context: pipeline.enrichedContext,
    documentType: "etp",
    draft: "# ESTUDO TÉCNICO PRELIMINAR\n\nA demanda trata da aquisição de papel A4.",
    plan: pipeline.documentPlan,
    skillContract: {
      ...pipeline.skillContract,
      stageOrder: ["extract_facts"],
    },
    writerStyle: pipeline.writerStyle,
  });

  assert.equal(review.status, "needs_revision");
  assert.ok(review.issues.some((issue) => issue.type === "template_violation"));
});

test("executeDocumentGenerationPipeline rewrites a generic misaligned draft once", async () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });
  const provider = createProvider(async (_input, callIndex) => ({
    model: "stub-model",
    providerKey: "stub",
    responseMetadata: { finishReason: "stop", callIndex },
    text:
      callIndex <= 2
        ? "# ESTUDO TECNICO PRELIMINAR\n\nRascunho gerado automaticamente para avaliacao interna."
        : [
            "# ESTUDO TECNICO PRELIMINAR",
            "",
            "A demanda trata de aquisicao de Kit Dia das Maes para distribuicao gratuita.",
            "",
            "A estimativa de valor sera apurada em etapa propria.",
          ].join("\n"),
  }));

  const result = await executeDocumentGenerationPipeline({
    documentId: DOCUMENT_ID,
    documentType: "etp",
    organizationId: ORGANIZATION_ID,
    pipeline,
    processId: PROCESS_ID,
    prompt: pipeline.prompt,
    textGeneration: provider,
  });

  assert.equal(provider.calls.length, 3);
  assert.match(provider.calls[1]?.prompt ?? "", /Humanization Pass/);
  assert.match(
    provider.calls[1]?.prompt ?? "",
    /Contrato runtime obrigatório: sd-document-intelligence/,
  );
  assert.match(provider.calls[2]?.prompt ?? "", /Final Rewrite Agent/);
  assert.match(
    provider.calls[2]?.prompt ?? "",
    /Nenhuma inferência antes da classificação semântica/,
  );
  assert.match(result.text, /Kit Dia das Maes/);
  assert.doesNotMatch(result.text, /Rascunho gerado automaticamente/i);
  const pipelineMetadata = result.responseMetadata.pipeline as {
    callCount: number;
    calls: Array<{ costUsd: number | null; responseId: string | null; stage: string }>;
    revisionCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
  };

  assert.equal(pipelineMetadata.revisionCount, 1);
  assert.equal(pipelineMetadata.callCount, 3);
  assert.deepEqual(
    pipelineMetadata.calls.map((call) => call.stage),
    ["writer", "humanization", "rewrite"],
  );
  assert.deepEqual(
    pipelineMetadata.calls.map((call) => call.responseId),
    [null, null, null],
  );
  assert.deepEqual(
    pipelineMetadata.calls.map((call) => call.costUsd),
    [null, null, null],
  );
  assert.equal(pipelineMetadata.totalInputTokens, 0);
  assert.equal(pipelineMetadata.totalOutputTokens, 0);
  assert.equal(pipelineMetadata.totalTokens, 0);
});

test("executeDocumentGenerationPipeline fails closed when strict pipeline contract is missing", async () => {
  const provider = createProvider(async () => ({
    model: "stub-model",
    providerKey: "stub",
    responseMetadata: {},
    text: "# ESTUDO TECNICO PRELIMINAR\n\nConteudo generico.",
  }));

  await assert.rejects(
    () =>
      executeDocumentGenerationPipeline({
        documentId: DOCUMENT_ID,
        documentType: "etp",
        organizationId: ORGANIZATION_ID,
        pipeline: null,
        pipelineRequired: true,
        processId: PROCESS_ID,
        prompt: "generic prompt",
        textGeneration: provider,
      }),
    (error: unknown) =>
      error instanceof TextGenerationError &&
      error.code === "invalid_request" &&
      /sd-document-intelligence/.test(error.message),
  );
  assert.equal(provider.calls.length, 0);
});

test("executeDocumentGenerationPipeline reviews the humanized draft before rewriting", async () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });
  const provider = createProvider(async (_input, callIndex) => ({
    model: "stub-model",
    providerKey: "stub",
    responseMetadata: { finishReason: "stop", callIndex },
    text:
      callIndex === 1
        ? "# ESTUDO TECNICO PRELIMINAR\n\nNa ausencia de contexto, o valor devera ser confirmado."
        : [
            "# ESTUDO TECNICO PRELIMINAR",
            "",
            "A demanda trata de aquisicao de Kit Dia das Maes para distribuicao gratuita.",
            "",
            "A estimativa sera apurada em etapa propria.",
          ].join("\n"),
  }));

  const result = await executeDocumentGenerationPipeline({
    documentId: DOCUMENT_ID,
    documentType: "etp",
    organizationId: ORGANIZATION_ID,
    pipeline,
    processId: PROCESS_ID,
    prompt: pipeline.prompt,
    textGeneration: provider,
  });
  const pipelineMetadata = result.responseMetadata.pipeline as {
    debug: {
      firstDraft: string;
      humanization: { draft: string; status: string };
      reviewResults: Array<{ issues: Array<{ type: string }> }>;
    };
    revisionCount: number;
  };

  assert.equal(provider.calls.length, 2);
  assert.equal(pipelineMetadata.revisionCount, 0);
  assert.match(provider.calls[1]?.prompt ?? "", /Humanization Pass/);
  assert.match(pipelineMetadata.debug.firstDraft, /Na ausencia de contexto/);
  assert.equal(pipelineMetadata.debug.humanization.status, "applied");
  assert.doesNotMatch(pipelineMetadata.debug.humanization.draft, /Na ausencia de contexto/i);
  assert.equal(
    pipelineMetadata.debug.reviewResults.some((review) =>
      review.issues.some((issue) => issue.type === "meta_language"),
    ),
    false,
  );
});

test("executeDocumentGenerationPipeline corrects humanization that adds unsupported values", async () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });
  const provider = createProvider(async (_input, callIndex) => ({
    model: "stub-model",
    providerKey: "stub",
    responseMetadata: { finishReason: "stop", callIndex },
    text:
      callIndex === 1
        ? [
            "# ESTUDO TECNICO PRELIMINAR",
            "",
            "A demanda trata de aquisicao de Kit Dia das Maes para distribuicao gratuita.",
            "",
            "A estimativa sera apurada em etapa propria.",
          ].join("\n")
        : callIndex === 2
          ? [
              "# ESTUDO TECNICO PRELIMINAR",
              "",
              "A demanda trata de aquisicao de Kit Dia das Maes para distribuicao gratuita.",
              "",
              "Valor estimado: R$ 12.000,00.",
            ].join("\n")
          : [
              "# ESTUDO TECNICO PRELIMINAR",
              "",
              "A demanda trata de aquisicao de Kit Dia das Maes para distribuicao gratuita.",
              "",
              "A estimativa sera apurada em etapa propria.",
            ].join("\n"),
  }));

  const result = await executeDocumentGenerationPipeline({
    documentId: DOCUMENT_ID,
    documentType: "etp",
    organizationId: ORGANIZATION_ID,
    pipeline,
    processId: PROCESS_ID,
    prompt: pipeline.prompt,
    textGeneration: provider,
  });
  const pipelineMetadata = result.responseMetadata.pipeline as {
    debug: { reviewResults: Array<{ issues: Array<{ type: string }> }> };
    revisionCount: number;
  };

  assert.equal(provider.calls.length, 3);
  assert.equal(pipelineMetadata.revisionCount, 1);
  assert.ok(
    pipelineMetadata.debug.reviewResults[0]?.issues.some(
      (issue) => issue.type === "invalid_value_handling",
    ),
  );
  assert.doesNotMatch(result.text, /R\$ 12\.000,00/);
});

test("executeDocumentGenerationPipeline handles representative SD profiles through the full pipeline", async () => {
  const visibleAiLanguage = [
    /na ausencia de contexto/i,
    /na ausência de contexto/i,
    /o contexto nao apresenta/i,
    /o contexto não apresenta/i,
    /quando informado/i,
    /quando suportado/i,
    /nao foi identificado/i,
    /não foi identificado/i,
    /devera ser confirmado/i,
    /deverá ser confirmado/i,
    /pipeline/i,
  ];
  const scenarios = [
    {
      expectedText: "assessoria tecnica em recursos humanos com execucao mensal",
      expectedType: "technical_service",
      expectedWriterStyle: "technical",
      object: "Contratacao de assessoria tecnica em recursos humanos com execucao mensal",
      sourceMetadata: null,
    },
    {
      expectedText: "Kit Dia das Maes para distribuicao gratuita",
      expectedType: "social_action",
      expectedWriterStyle: "institutional",
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    },
    {
      expectedText: "apresentacao artistica musical para festa cultural",
      expectedType: "event",
      expectedWriterStyle: "institutional",
      object: "Contratacao de apresentacao artistica musical para festa cultural",
      sourceMetadata: null,
    },
    {
      expectedText: "aquisicao simples de papel A4",
      expectedType: "goods",
      expectedWriterStyle: "administrative",
      object: "Aquisicao simples de papel A4",
      sourceMetadata: null,
    },
  ] as const;

  for (const scenario of scenarios) {
    const { pipeline } = buildPipeline({
      process: createProcessRow({
        object: scenario.object,
        sourceMetadata: scenario.sourceMetadata,
      }),
    });
    const provider = createProvider(async (_input, callIndex) => ({
      model: "stub-model",
      providerKey: "stub",
      responseMetadata: { finishReason: "stop", callIndex },
      text: [
        "# ESTUDO TECNICO PRELIMINAR",
        "",
        `A demanda trata de ${scenario.expectedText}.`,
        "",
        "A estimativa sera apurada em etapa propria.",
      ].join("\n"),
    }));

    const result = await executeDocumentGenerationPipeline({
      documentId: DOCUMENT_ID,
      documentType: "etp",
      organizationId: ORGANIZATION_ID,
      pipeline,
      processId: PROCESS_ID,
      prompt: pipeline.prompt,
      textGeneration: provider,
    });
    const metadata = result.responseMetadata.pipeline as {
      debug: { writerStyle: string };
      finalReviewStatus: string;
      revisionCount: number;
    };

    assert.equal(pipeline.enrichedContext.classification.procurementType, scenario.expectedType);
    assert.equal(pipeline.writerStyle, scenario.expectedWriterStyle);
    assert.equal(metadata.debug.writerStyle, scenario.expectedWriterStyle);
    assert.equal(
      (result.responseMetadata.pipeline as { debug: { skillContract: { name: string } } }).debug
        .skillContract.name,
      "sd-document-intelligence",
    );
    assert.equal(metadata.finalReviewStatus, "approved");
    assert.equal(metadata.revisionCount, 0);
    assert.match(result.text, new RegExp(scenario.expectedText, "i"));

    for (const pattern of visibleAiLanguage) {
      assert.doesNotMatch(result.text, pattern);
    }

    if (scenario.expectedType === "goods") {
      assert.equal(pipeline.documentPlan.recommendedDepth, "simplified");
      assert.ok(result.text.length < 1500);
    }
  }
});

test("executeDocumentGenerationPipeline caps automatic rewrites at two cycles", async () => {
  const { pipeline } = buildPipeline({
    process: createProcessRow({
      object: "Aquisicao de kits Dia das Maes para distribuicao gratuita",
      sourceMetadata: {
        extractedFields: {
          items: [{ description: "Kit Dia das Maes", quantity: "100", unit: "UN" }],
          totalValue: "0,00",
        },
      },
    }),
  });
  const provider = createProvider(async (_input, callIndex) => ({
    model: "stub-model",
    providerKey: "stub",
    responseMetadata: {
      callIndex,
      costUsd: callIndex / 100,
      finishReason: "stop",
      responseId: `response_${callIndex}`,
      status: "completed",
      usage: {
        input_tokens: callIndex * 100,
        input_tokens_details: {
          cached_tokens: callIndex,
        },
        output_tokens: callIndex * 10,
        total_tokens: callIndex * 110,
      },
    },
    text: "# ESTUDO TECNICO PRELIMINAR\n\nRascunho gerado automaticamente para avaliacao interna.",
  }));

  const result = await executeDocumentGenerationPipeline({
    documentId: DOCUMENT_ID,
    documentType: "etp",
    organizationId: ORGANIZATION_ID,
    pipeline,
    processId: PROCESS_ID,
    prompt: pipeline.prompt,
    textGeneration: provider,
  });
  const pipelineMetadata = result.responseMetadata.pipeline as {
    callCount: number;
    calls: Array<{
      costUsd: number | null;
      model: string;
      providerKey: string;
      responseId: string | null;
      stage: string;
      usage: {
        input_tokens: number;
        input_tokens_details: {
          cached_tokens: number;
        };
        output_tokens: number;
        output_tokens_details: {
          reasoning_tokens: number;
        };
        total_tokens: number;
      };
    }>;
    debug: { reviewResults: unknown[]; rewriteAttempts: unknown[] };
    finalReviewStatus: string;
    revisionCount: number;
    status: string;
    totalCachedInputTokens: number;
    totalCostUsd: number | null;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
  };

  assert.equal(provider.calls.length, 4);
  assert.equal(result.responseMetadata.responseId, "response_4");
  assert.equal(result.responseMetadata.status, "completed");
  assert.equal(pipelineMetadata.revisionCount, 2);
  assert.equal(pipelineMetadata.finalReviewStatus, "needs_revision");
  assert.equal(pipelineMetadata.status, "completed");
  assert.equal(pipelineMetadata.debug.reviewResults.length, 3);
  assert.equal(pipelineMetadata.debug.rewriteAttempts.length, 2);
  assert.equal(pipelineMetadata.callCount, 4);
  assert.deepEqual(
    pipelineMetadata.calls.map((call) => call.stage),
    ["writer", "humanization", "rewrite", "rewrite"],
  );
  assert.deepEqual(
    pipelineMetadata.calls.map((call) => call.responseId),
    ["response_1", "response_2", "response_3", "response_4"],
  );
  assert.equal(pipelineMetadata.calls[0]?.model, "stub-model");
  assert.equal(pipelineMetadata.calls[0]?.providerKey, "stub");
  assert.deepEqual(pipelineMetadata.calls[0]?.usage, {
    input_tokens: 100,
    input_tokens_details: {
      cached_tokens: 1,
    },
    output_tokens: 10,
    output_tokens_details: {
      reasoning_tokens: 0,
    },
    total_tokens: 110,
  });
  assert.equal(pipelineMetadata.totalInputTokens, 1_000);
  assert.equal(pipelineMetadata.totalCachedInputTokens, 10);
  assert.equal(pipelineMetadata.totalOutputTokens, 100);
  assert.equal(pipelineMetadata.totalTokens, 1_100);
  assert.equal(pipelineMetadata.totalCostUsd, 0.1);
});
