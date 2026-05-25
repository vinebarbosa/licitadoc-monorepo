import type {
  GeneratedDocumentType,
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
} from "../../shared/text-generation/types";
import { TextGenerationError } from "../../shared/text-generation/types";
import {
  normalizeTextGenerationUsage,
  type TextGenerationUsage,
} from "../../shared/text-generation/usage-cost";
import type { SerializedProcessItem } from "../processes/processes.shared";
import {
  type DocumentGenerationPipelineDebug,
  type DocumentHumanizationResult,
  type DocumentPlan,
  type DocumentReviewIssue,
  type DocumentReviewResult,
  documentGenerationPipelineDebugSchema,
  documentPlanSchema,
  documentReviewResultSchema,
  type EnrichedContextPackage,
  type ExtractedSdFacts,
  enrichedContextPackageSchema,
  extractedSdFactsSchema,
  type NormalizedSdItem,
  type ProcurementClassification,
  type SdDocumentIntelligenceContractMetadata,
  sdDocumentIntelligenceContractMetadataSchema,
  type WriterStyle,
  writerStyleSchema,
} from "./document-generation-pipeline.schemas";
import {
  analyzeMinutaClauseStructure,
  buildDocumentGenerationPrompt,
  type StoredDepartment,
  type StoredOrganization,
  type StoredProcess,
  sanitizeGeneratedDocumentDraft,
} from "./documents.shared";
import {
  assertSdDocumentIntelligenceContractMetadataCurrent,
  loadSdDocumentIntelligenceContract,
  type SdDocumentIntelligenceContract,
} from "./sd-document-intelligence-contract";

export const MAX_DOCUMENT_REWRITE_CYCLES = 2;

type DocumentGenerationPipelineCallStage = "writer" | "humanization" | "rewrite";

type DocumentGenerationPipelineCallMetadata = {
  costUsd: number | null;
  model: string;
  providerKey: string;
  responseId: string | null;
  stage: DocumentGenerationPipelineCallStage;
  usage: TextGenerationUsage;
};

type BuildPipelineInput = {
  departments: StoredDepartment[];
  documentType: GeneratedDocumentType;
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
  processItems: SerializedProcessItem[];
  responsibleUserName: string | null;
};

export type InitialDocumentGenerationPipeline = {
  debugRequested: boolean;
  documentPlan: DocumentPlan;
  enrichedContext: EnrichedContextPackage;
  extractedFacts: ExtractedSdFacts;
  prompt: string;
  skillContract: SdDocumentIntelligenceContractMetadata;
  writerStyle: WriterStyle;
};

type ExecutePipelineInput = {
  documentId: string;
  documentType: GeneratedDocumentType;
  organizationId: string;
  pipeline: InitialDocumentGenerationPipeline | null;
  pipelineRequired?: boolean;
  processId: string;
  prompt: string;
  textGeneration: TextGenerationProvider;
  onChunk?: TextGenerationInput["onChunk"];
  onPlanningChunk?: TextGenerationInput["onPlanningChunk"];
};

export type ExecutedDocumentGenerationPipeline = {
  model: string;
  providerKey: string;
  responseMetadata: Record<string, unknown>;
  text: string;
};

function normalizeText(value: string) {
  return value.trim();
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNullableText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const next = normalizeText(value);

  return next.length > 0 ? next : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = getNullableText(value);

    if (text) {
      return text;
    }
  }

  return null;
}

function getNestedValue(record: Record<string, unknown> | null, fieldPath: string) {
  if (!record) {
    return null;
  }

  let current: unknown = record;

  for (const segment of fieldPath.split(".")) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  return current;
}

function getNestedText(record: Record<string, unknown> | null, fieldPath: string) {
  return getNullableText(getNestedValue(record, fieldPath));
}

function getExtractedFields(process: StoredProcess) {
  if (!isRecord(process.sourceMetadata)) {
    return null;
  }

  const extractedFields = process.sourceMetadata.extractedFields;

  return isRecord(extractedFields) ? extractedFields : null;
}

function getSourceRecord(process: StoredProcess) {
  return isRecord(process.sourceMetadata) ? process.sourceMetadata : null;
}

function parseLocalizedNumber(rawValue: unknown) {
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  const value = getNullableText(rawValue);

  if (!value) {
    return null;
  }

  const sanitized = value.replace(/[^\d,.-]/g, "").replace(/\s+/g, "");

  if (!/\d/.test(sanitized)) {
    return null;
  }

  const lastCommaIndex = sanitized.lastIndexOf(",");
  const lastDotIndex = sanitized.lastIndexOf(".");
  const decimalSeparator =
    lastCommaIndex > lastDotIndex ? "," : lastDotIndex > lastCommaIndex ? "." : null;
  let normalized = sanitized;

  if (decimalSeparator) {
    const decimalIndex = sanitized.lastIndexOf(decimalSeparator);
    const integerPart = sanitized.slice(0, decimalIndex).replace(/[,.]/g, "");
    const decimalPart = sanitized.slice(decimalIndex + 1).replace(/[,.]/g, "");
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = sanitized.replace(/[,.]/g, "");
  }

  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? amount : null;
}

export function normalizePipelineMoneyValue(rawValue: unknown) {
  const rawText = getNullableText(rawValue);
  const amount = parseLocalizedNumber(rawValue);

  if (amount === null || amount === 0) {
    return {
      amount: null,
      hasValidValue: false,
      rawValue: rawText,
    };
  }

  return {
    amount,
    hasValidValue: amount > 0,
    rawValue: rawText,
  };
}

function normalizeQuantity(rawValue: unknown) {
  const amount = parseLocalizedNumber(rawValue);

  return amount === null ? null : amount;
}

function normalizeItemComponent(component: {
  description?: unknown;
  quantity?: unknown;
  title?: unknown;
  unit?: unknown;
}) {
  const description = firstText(component.description, component.title);

  if (!description) {
    return null;
  }

  return {
    description,
    quantity: normalizeQuantity(component.quantity),
    rawQuantity: getNullableText(component.quantity),
    title: getNullableText(component.title),
    unit: getNullableText(component.unit),
  };
}

function normalizeProcessItem(item: SerializedProcessItem): NormalizedSdItem | null {
  const unitValue = normalizePipelineMoneyValue(item.unitValue);
  const totalValue = normalizePipelineMoneyValue(item.totalValue);
  const description = firstText(item.description, item.title);

  if (!description) {
    return null;
  }

  return {
    code: item.code,
    components:
      item.kind === "kit"
        ? item.components
            .map((component) =>
              normalizeItemComponent({
                description: component.description,
                quantity: component.quantity,
                title: component.title,
                unit: component.unit,
              }),
            )
            .filter((component): component is NonNullable<typeof component> => component !== null)
        : [],
    description,
    kind: item.kind,
    quantity: normalizeQuantity(item.quantity),
    rawQuantity: getNullableText(item.quantity),
    rawTotalValue: totalValue.rawValue,
    rawUnitValue: unitValue.rawValue,
    title: getNullableText(item.title),
    totalValue: totalValue.amount,
    unit: getNullableText(item.unit),
    unitValue: unitValue.amount,
  };
}

function normalizeSourceItem(item: unknown): NormalizedSdItem | null {
  if (!isRecord(item)) {
    return null;
  }

  const unitValueRaw = firstText(item.unitValue, item.valorUnitario, item.unit_price);
  const totalValueRaw = firstText(item.totalValue, item.valorTotal, item.total_price);
  const unitValue = normalizePipelineMoneyValue(unitValueRaw);
  const totalValue = normalizePipelineMoneyValue(totalValueRaw);
  const description = firstText(
    item.description,
    item.itemDescription,
    item.descricao,
    item.title,
    item.nome,
  );

  if (!description) {
    return null;
  }

  return {
    code: firstText(item.code, item.itemCode, item.codigo),
    components: [],
    description,
    kind: "source",
    quantity: normalizeQuantity(firstText(item.quantity, item.quantidade)),
    rawQuantity: firstText(item.quantity, item.quantidade),
    rawTotalValue: totalValue.rawValue,
    rawUnitValue: unitValue.rawValue,
    title: firstText(item.title, item.nome),
    totalValue: totalValue.amount,
    unit: firstText(item.unit, item.unidade),
    unitValue: unitValue.amount,
  };
}

function getExtractedItems(process: StoredProcess, processItems: SerializedProcessItem[]) {
  const canonicalItems = processItems
    .map(normalizeProcessItem)
    .filter((item): item is NormalizedSdItem => item !== null);

  if (canonicalItems.length > 0) {
    return canonicalItems;
  }

  const extractedFields = getExtractedFields(process);
  const rawItems = extractedFields?.items;

  if (Array.isArray(rawItems)) {
    const sourceItems = rawItems
      .map(normalizeSourceItem)
      .filter((item): item is NormalizedSdItem => item !== null);

    if (sourceItems.length > 0) {
      return sourceItems;
    }
  }

  const singleItem = normalizeSourceItem(getNestedValue(extractedFields, "item"));

  return singleItem ? [singleItem] : [];
}

function getBudgetData(process: StoredProcess) {
  const extractedFields = getExtractedFields(process);
  const sourceRecord = getSourceRecord(process);
  const budgetData = firstRecord(
    getNestedValue(extractedFields, "budgetData"),
    getNestedValue(extractedFields, "budget"),
    getNestedValue(extractedFields, "orcamento"),
    getNestedValue(sourceRecord, "budgetData"),
  );
  const budgetAllocation = firstText(
    getNestedText(extractedFields, "budgetAllocation"),
    getNestedText(extractedFields, "budget.allocation"),
    getNestedText(extractedFields, "dotacao"),
    getNestedText(extractedFields, "dotacaoOrcamentaria"),
  );

  if (!budgetData && !budgetAllocation) {
    return undefined;
  }

  return {
    ...(budgetData ?? {}),
    ...(budgetAllocation ? { budgetAllocation } : {}),
  };
}

function firstRecord(...values: unknown[]) {
  for (const value of values) {
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
}

function getEstimatedValue(process: StoredProcess, items: NormalizedSdItem[]) {
  const itemTotal = items.reduce((total, item) => total + (item.totalValue ?? 0), 0);

  if (itemTotal > 0) {
    return itemTotal;
  }

  const extractedFields = getExtractedFields(process);
  const candidates = [
    getNestedValue(extractedFields, "totalValue"),
    getNestedValue(extractedFields, "estimatedValue"),
    getNestedValue(extractedFields, "estimateValue"),
    getNestedValue(extractedFields, "contractValue"),
    getNestedValue(extractedFields, "value"),
    getNestedValue(extractedFields, "item.totalValue"),
    getNestedValue(extractedFields, "item.unitValue"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizePipelineMoneyValue(candidate);

    if (normalized.hasValidValue) {
      return normalized.amount;
    }
  }

  return null;
}

export function extractDocumentGenerationFacts({
  process,
  processItems,
}: {
  process: StoredProcess;
  processItems: SerializedProcessItem[];
}) {
  const extractedFields = getExtractedFields(process);
  const items = getExtractedItems(process, processItems);
  const estimatedValue = getEstimatedValue(process, items);
  const facts = extractedSdFactsSchema.parse({
    budgetData: getBudgetData(process),
    estimatedValue,
    hasValidEstimatedValue: estimatedValue !== null && estimatedValue > 0,
    items,
    justification: firstText(
      getNestedText(extractedFields, "justification"),
      process.justification,
    ),
    originalObject: firstText(getNestedText(extractedFields, "object"), process.object),
    sourceClassification: firstText(
      getNestedText(extractedFields, "classification"),
      getNestedText(extractedFields, "classificacao"),
      process.type,
    ),
  });

  return facts;
}

function inferProbableLegalPath(process: StoredProcess) {
  const text = normalizeSearchText(
    [process.procurementMethod, process.biddingModality, process.type].filter(Boolean).join(" "),
  );

  if (/\bdispensa\b/.test(text)) {
    return "dispensa" as const;
  }

  if (/\bpregao\b|\breverse auction\b|\bauction\b/.test(text)) {
    return "pregao" as const;
  }

  if (/\bcredenciamento\b/.test(text)) {
    return "credenciamento" as const;
  }

  if (/\bconcorrencia\b/.test(text)) {
    return "concorrencia" as const;
  }

  return "undefined" as const;
}

function classifyProcurement({
  facts,
  process,
}: {
  facts: ExtractedSdFacts;
  process: StoredProcess;
}): ProcurementClassification {
  const evidence = normalizeSearchText(
    [
      facts.originalObject,
      facts.justification,
      facts.sourceClassification,
      process.procurementMethod,
      process.biddingModality,
      ...facts.items.flatMap((item) => [
        item.title,
        item.description,
        ...item.components.flatMap((component) => [component.title, component.description]),
      ]),
    ]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );
  const has = (pattern: RegExp) => pattern.test(evidence);
  const signals: string[] = [];
  let procurementType: ProcurementClassification["procurementType"] = "service";

  if (has(/\b(obra|engenharia|construcao|reforma|projeto executivo|art|rrt)\b/)) {
    procurementType = "engineering";
    signals.push("obra ou engenharia");
  } else if (
    has(
      /\b(distribuicao gratuita|beneficiario|beneficiarios|acao social|vulneravel|vulnerabilidade|doacao|kit dia das maes|kits dia das maes)\b/,
    )
  ) {
    procurementType = "social_action";
    signals.push("distribuicao ou acao social");
  } else if (
    has(/\b(dia das maes|dia dos pais|campanha|comemorativa|brinde|institucional|solenidade)\b/)
  ) {
    procurementType = "institutional_action";
    signals.push("acao institucional ou comemorativa");
  } else if (
    has(
      /\b(apresentacao artistica|atracao artistica|show|banda|artista|musical|cultural|festa|evento|festividade|programacao)\b/,
    )
  ) {
    procurementType = "event";
    signals.push("evento ou apresentacao cultural");
  } else if (
    has(
      /\b(assessoria|consultoria|recursos humanos|rh|apoio tecnico|suporte tecnico|laudo|parecer|treinamento|analise tecnica)\b/,
    )
  ) {
    procurementType = "technical_service";
    signals.push("servico tecnico ou assessoria");
  } else if (has(/\b(continuado|continuada|mensal|rotina permanente|12 meses|permanente)\b/)) {
    procurementType = "continuous_service";
    signals.push("servico continuado ou recorrente");
  } else if (has(/\b(equipamento|mobiliario|patrimonio|bem permanente|tombamento)\b/)) {
    procurementType = "permanent_asset";
    signals.push("bem permanente");
  } else if (
    has(
      /\b(material de consumo|expediente|limpeza|combustivel|insumo|insumos|genero alimenticio)\b/,
    )
  ) {
    procurementType = "consumable_material";
    signals.push("material de consumo");
  } else if (has(/\b(aquisicao|compra|fornecimento|material|produto|bem|bens|kit|kits)\b/)) {
    procurementType = "goods";
    signals.push("aquisicao ou fornecimento de bens");
  }

  const operationalNature: ProcurementClassification["operationalNature"] = has(
    /\b(continuado|continuada|mensal|permanente|rotina permanente|12 meses)\b/,
  )
    ? "continuous"
    : has(/\b(dia das maes|natal|carnaval|festa|evento|data|campanha|sazonal|calendario)\b/)
      ? "seasonal"
      : has(/\b(recorrente|periodico|periodica|anual)\b/)
        ? "recurring"
        : "one_time";

  const publicInterestProfile: ProcurementClassification["publicInterestProfile"] =
    procurementType === "social_action"
      ? "social"
      : procurementType === "event" || procurementType === "institutional_action"
        ? "institutional"
        : procurementType === "technical_service" && has(/\b(rh|recursos humanos)\b/)
          ? "internal_administration"
          : procurementType === "engineering"
            ? "direct_public_service"
            : procurementType === "goods" || procurementType === "consumable_material"
              ? "operational_support"
              : "internal_administration";

  const executionComplexity: ProcurementClassification["executionComplexity"] =
    procurementType === "engineering" ||
    (procurementType === "technical_service" &&
      (operationalNature === "continuous" || operationalNature === "recurring")) ||
    procurementType === "continuous_service"
      ? "high"
      : procurementType === "event" ||
          procurementType === "social_action" ||
          procurementType === "institutional_action" ||
          facts.items.length > 5
        ? "medium"
        : "low";

  const confidence = Math.min(0.94, Math.max(0.58, 0.64 + signals.length * 0.1));

  return {
    confidence,
    executionComplexity,
    operationalNature,
    probableLegalPath: inferProbableLegalPath(process),
    procurementType,
    publicInterestProfile,
    reasoning:
      signals.length > 0
        ? `Classificacao baseada em sinais de ${signals.join(", ")} presentes no objeto, justificativa ou itens.`
        : "Classificacao conservadora por ausencia de sinais especificos suficientes no objeto e nos itens.",
  };
}

function summarizeItem(item: NormalizedSdItem) {
  return item.title && item.title !== item.description
    ? `${item.title}: ${item.description}`
    : item.description;
}

function buildSemanticObject({
  classification,
  facts,
}: {
  classification: ProcurementClassification;
  facts: ExtractedSdFacts;
}) {
  const itemSummaries = facts.items.map(summarizeItem);
  const originalObject = facts.originalObject ?? "objeto nao informado";
  const label =
    classification.procurementType === "social_action"
      ? "Itens para distribuicao ou acao social"
      : classification.procurementType === "institutional_action"
        ? "Itens ou servicos de acao institucional"
        : classification.procurementType === "event"
          ? "Execucao cultural, artistica ou evento"
          : classification.procurementType === "technical_service"
            ? "Servico tecnico especializado"
            : classification.procurementType === "continuous_service"
              ? "Servico operacional continuado"
              : classification.procurementType === "goods" ||
                  classification.procurementType === "consumable_material" ||
                  classification.procurementType === "permanent_asset"
                ? "Bens e materiais"
                : "Nucleo do objeto";
  const compressedDescription =
    classification.procurementType === "technical_service"
      ? `servico tecnico especializado relacionado a ${originalObject}`
      : classification.procurementType === "social_action"
        ? `aquisicao ou organizacao pontual vinculada a acao social ou distribuicao gratuita: ${originalObject}`
        : classification.procurementType === "event"
          ? `contratacao vinculada a evento ou apresentacao cultural: ${originalObject}`
          : classification.procurementType === "goods" ||
              classification.procurementType === "consumable_material" ||
              classification.procurementType === "permanent_asset"
            ? `aquisicao ou fornecimento de bens/materiais: ${originalObject}`
            : originalObject;

  return {
    compressedDescription,
    itemGroups: [
      {
        items: itemSummaries.length > 0 ? itemSummaries : [originalObject],
        label,
        purpose:
          classification.publicInterestProfile === "social"
            ? "Atender finalidade publica com controle de beneficiarios e entrega."
            : classification.publicInterestProfile === "institutional"
              ? "Viabilizar acao institucional proporcional ao interesse publico."
              : "Atender necessidade administrativa descrita no processo.",
      },
    ],
  };
}

function createInference(
  key: string,
  value: string,
  confidence: number,
  source: "explicit" | "semantic_inference" | "administrative_hypothesis",
  reasoning: string,
) {
  return {
    confidence,
    key,
    reasoning,
    source,
    value,
  };
}

function buildInferences({
  classification,
  facts,
}: {
  classification: ProcurementClassification;
  facts: ExtractedSdFacts;
}) {
  const inferences = [
    createInference(
      "operational_nature",
      classification.operationalNature,
      classification.confidence,
      "semantic_inference",
      "Derivada da classificacao semantica do objeto.",
    ),
    createInference(
      "document_depth",
      classification.executionComplexity === "high"
        ? "demanda tratamento documental robusto e fiscalizavel"
        : classification.executionComplexity === "medium"
          ? "demanda tratamento documental padrao e proporcional"
          : "demanda tratamento documental objetivo e enxuto",
      0.78,
      "semantic_inference",
      "A profundidade acompanha a complexidade de execucao classificada.",
    ),
  ];

  if (facts.justification) {
    inferences.push(
      createInference(
        "administrative_purpose",
        facts.justification,
        0.95,
        "explicit",
        "Justificativa literal informada no processo ou na SD.",
      ),
    );
  }

  if (!facts.hasValidEstimatedValue) {
    inferences.push(
      createInference(
        "estimate_status",
        "nao ha estimativa valida disponivel; valor zero deve ser tratado como ausencia",
        0.98,
        "explicit",
        "Valores ausentes ou zerados nao comprovam preco valido.",
      ),
    );
  }

  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service"
  ) {
    inferences.push(
      createInference(
        "execution_evidence",
        "a execucao deve ser acompanhada por entregaveis, evidencias ou registros revisaveis",
        0.78,
        "semantic_inference",
        "Servicos tecnicos ou recorrentes exigem prova de execucao e aceite.",
      ),
    );
  }

  return inferences;
}

function buildPendingIssues({
  classification,
  facts,
}: {
  classification: ProcurementClassification;
  facts: ExtractedSdFacts;
}) {
  const issues = [];

  if (!facts.hasValidEstimatedValue) {
    issues.push({
      description: "A SD/processo nao apresenta estimativa monetaria valida.",
      impact:
        "Impede conclusao segura sobre valor, preco contratual ou compatibilidade de mercado.",
      key: "missing_valid_estimate",
      recommendedAction: "Apurar estimativa em etapa propria e registrar metodologia de pesquisa.",
    });
  }

  if (
    classification.procurementType === "social_action" ||
    classification.procurementType === "institutional_action"
  ) {
    issues.push({
      description:
        "Confirmar publico-alvo, criterio de distribuicao e forma de controle, se ainda nao constarem no processo.",
      impact: "Evita fragilidade na justificativa do quantitativo e na rastreabilidade da entrega.",
      key: "distribution_criteria",
      recommendedAction:
        "Registrar beneficiarios, criterio objetivo, responsavel pelo controle e evidencia de entrega.",
    });
  }

  if (classification.procurementType === "event") {
    issues.push({
      description:
        "Confirmar data, local, janela de execucao e evidencia de realizacao do evento ou apresentacao.",
      impact:
        "Reduz risco de perda de utilidade por atraso ou de dificuldade de comprovar execucao.",
      key: "event_execution_details",
      recommendedAction:
        "Incluir calendario, local, comprovacao de execucao e regra de aceite quando aplicavel.",
    });
  }

  if (classification.procurementType === "technical_service") {
    issues.push({
      description:
        "Delimitar escopo, entregaveis, periodicidade e limites da assessoria ou suporte tecnico.",
      impact: "Evita contratacao generica e facilita fiscalizacao.",
      key: "technical_scope_delimitation",
      recommendedAction:
        "Registrar produtos esperados, responsabilidades, evidencias e criterios de aceite.",
    });
  }

  return issues;
}

function buildRisks({
  classification,
  facts,
}: {
  classification: ProcurementClassification;
  facts: ExtractedSdFacts;
}) {
  const risks = [];

  if (!facts.hasValidEstimatedValue) {
    risks.push({
      cause: "Valor ausente ou informado como zero.",
      impact: "Preco pode ser apresentado sem base valida se a lacuna nao for tratada.",
      mitigation: "Manter o valor como pendente e exigir apuracao posterior antes da conclusao.",
      risk: "Ausencia de estimativa valida",
      severity: "high" as const,
    });
  }

  if (
    classification.procurementType === "social_action" ||
    classification.procurementType === "institutional_action"
  ) {
    risks.push({
      cause: "Distribuicao ou acao pontual depende de controle administrativo.",
      impact: "Pode haver questionamento sobre destinatarios, quantitativo ou finalidade.",
      mitigation: "Definir criterio, lista/registro de entrega e responsavel pelo acompanhamento.",
      risk: "Controle insuficiente de distribuicao",
      severity: "medium" as const,
    });
  }

  if (classification.procurementType === "event") {
    risks.push({
      cause: "Objeto vinculado a data, programacao ou apresentacao especifica.",
      impact: "Atraso ou falha de comprovacao pode retirar utilidade da contratacao.",
      mitigation: "Confirmar agenda, local, evidencia de execucao e regra de aceite.",
      risk: "Perda de utilidade por atraso ou execucao nao comprovada",
      severity: "medium" as const,
    });
  }

  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service"
  ) {
    risks.push({
      cause: "Servico depende de escopo, entregaveis e acompanhamento claros.",
      impact: "Execucao pode ficar subjetiva ou gerar dependencia operacional sem controle.",
      mitigation: "Definir entregaveis, periodicidade, fiscalizacao e evidencias de aceite.",
      risk: "Escopo tecnico pouco verificavel",
      severity: classification.executionComplexity === "high" ? "high" : "medium",
    });
  }

  if (risks.length === 0) {
    risks.push({
      cause: "Objeto de baixa complexidade ainda depende de especificacao e recebimento.",
      impact: "Entrega divergente pode gerar retrabalho ou recebimento inadequado.",
      mitigation: "Confirmar especificacoes, quantidades, unidade, entrega e recebimento.",
      risk: "Recebimento inadequado do objeto",
      severity: "low" as const,
    });
  }

  return risks;
}

function buildAlternatives(classification: ProcurementClassification) {
  const alternatives = [
    {
      adoptionCondition: "Quando o escopo e a estimativa forem confirmados.",
      advantages: [
        "Preserva a finalidade administrativa ja identificada.",
        "Evita recomecar a instrucao sem necessidade.",
      ],
      description: "Prosseguir com a solucao descrita na SD, ajustando apenas lacunas e controles.",
      limitations: ["Depende da confirmacao das pendencias registradas."],
      title: "Manter a solucao proposta com ajustes de instrucao",
    },
    {
      adoptionCondition:
        "Quando a unidade identificar excesso, insuficiencia ou ambiguidades no objeto.",
      advantages: ["Melhora proporcionalidade.", "Facilita pesquisa de precos e fiscalizacao."],
      description:
        "Revisar quantidades, agrupamentos, entregaveis ou forma de execucao antes da geracao final.",
      limitations: ["Pode exigir nova validacao pela unidade requisitante."],
      title: "Ajustar escopo antes da contratacao",
    },
  ];

  if (
    classification.procurementType === "goods" ||
    classification.procurementType === "consumable_material" ||
    classification.procurementType === "permanent_asset"
  ) {
    alternatives.push({
      adoptionCondition: "Quando houver itens independentes e ganho de competitividade.",
      advantages: ["Pode ampliar competicao.", "Pode reduzir risco de agrupamento indevido."],
      description: "Avaliar lote unico, parcelamento ou fornecimento por grupos funcionais.",
      limitations: ["Parcelamento pode aumentar gestao de entregas."],
      title: "Reavaliar agrupamento ou parcelamento dos itens",
    });
  }

  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service"
  ) {
    alternatives.push({
      adoptionCondition: "Quando houver equipe interna apta e disponibilidade operacional.",
      advantages: ["Reduz dependencia externa.", "Pode simplificar controle contratual."],
      description:
        "Comparar contratacao externa com execucao interna parcial ou apoio tecnico delimitado.",
      limitations: ["Pode nao atender necessidade especializada ou recorrente."],
      title: "Execucao interna parcial ou apoio externo delimitado",
    });
  }

  return alternatives;
}

export function deriveWriterStyle({
  classification,
  documentType,
}: {
  classification: ProcurementClassification;
  documentType: GeneratedDocumentType;
}): WriterStyle {
  if (documentType === "minuta") {
    return "dry_legal";
  }

  if (documentType === "tr") {
    return "operational";
  }

  if (documentType === "dfd") {
    return "administrative";
  }

  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service" ||
    classification.operationalNature === "continuous"
  ) {
    return "technical";
  }

  if (
    classification.procurementType === "social_action" ||
    classification.procurementType === "institutional_action" ||
    classification.procurementType === "event" ||
    classification.publicInterestProfile === "social" ||
    classification.publicInterestProfile === "institutional"
  ) {
    return "institutional";
  }

  return "administrative";
}

function getRecommendedTone(classification: ProcurementClassification) {
  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service"
  ) {
    return "analitico, tecnico-operacional e orientado a fiscalizacao";
  }

  if (classification.procurementType === "event") {
    return "institucional, objetivo e atento a tempestividade";
  }

  if (
    classification.procurementType === "social_action" ||
    classification.procurementType === "institutional_action"
  ) {
    return "institucional, proporcional e orientado a controle de entrega";
  }

  if (classification.procurementType === "engineering") {
    return "tecnico, cauteloso e orientado a risco";
  }

  return "administrativo, direto e proporcional";
}

function planDepthFor(
  classification: ProcurementClassification,
  documentType: DocumentPlan["documentType"],
) {
  if (documentType === "DFD") {
    return "simplified" as const;
  }

  if (classification.executionComplexity === "high") {
    return "robust" as const;
  }

  if (classification.executionComplexity === "medium") {
    return "standard" as const;
  }

  return documentType === "MINUTA" ? ("standard" as const) : ("simplified" as const);
}

function classificationFocusAreas(classification: ProcurementClassification) {
  if (
    classification.procurementType === "technical_service" ||
    classification.procurementType === "continuous_service"
  ) {
    return ["escopo", "entregaveis", "periodicidade", "evidencia de execucao", "fiscalizacao"];
  }

  if (
    classification.procurementType === "social_action" ||
    classification.procurementType === "institutional_action"
  ) {
    return [
      "finalidade publica",
      "criterio de distribuicao",
      "quantitativo",
      "controle de entrega",
    ];
  }

  if (classification.procurementType === "event") {
    return ["data sensivel", "local", "execucao", "comprovacao", "risco de atraso"];
  }

  if (
    classification.procurementType === "goods" ||
    classification.procurementType === "consumable_material" ||
    classification.procurementType === "permanent_asset"
  ) {
    return ["especificacao", "quantidade", "entrega", "recebimento", "garantia quando cabivel"];
  }

  return ["objeto", "justificativa", "valor", "fiscalizacao proporcional"];
}

export function buildDocumentPlan({
  classification,
  documentType,
  facts,
}: {
  classification: ProcurementClassification;
  documentType: DocumentPlan["documentType"];
  facts: ExtractedSdFacts;
}) {
  const sharedHints = [
    "Usar o pacote de contexto enriquecido como fonte de interpretacao.",
    "Nao transformar inferencias em fatos confirmados.",
    "Tratar valores zerados como ausencia de estimativa valida.",
  ];
  const valueHint = facts.hasValidEstimatedValue
    ? [`Valor estimado valido disponivel: ${facts.estimatedValue}.`]
    : ["Indicar que a estimativa/preco esta pendente de apuracao; nao usar zero como preco."];
  const focusAreas = classificationFocusAreas(classification);
  const plan =
    documentType === "DFD"
      ? {
          avoid: [
            "estudo de mercado",
            "analise profunda de riscos",
            "clausulas contratuais",
            "detalhamento operacional de TR",
          ],
          documentType,
          focusAreas: ["formalizacao inicial", "objeto", "justificativa", "requisitos essenciais"],
          generationHints: [
            ...sharedHints,
            "Ser curto, administrativo e introdutorio.",
            ...valueHint,
          ],
          recommendedDepth: planDepthFor(classification, documentType),
        }
      : documentType === "ETP"
        ? {
            avoid: [
              "clausulas contratuais",
              "obrigacoes operacionais detalhadas de TR",
              "parecer juridico",
            ],
            documentType,
            focusAreas: [
              "necessidade",
              "alternativas",
              "riscos",
              "estimativa",
              "sustentabilidade quando compativel",
              "gestao e fiscalizacao",
              ...focusAreas,
            ],
            generationHints: [
              ...sharedHints,
              "Manter analise proporcional a complexidade.",
              ...valueHint,
            ],
            recommendedDepth: planDepthFor(classification, documentType),
          }
        : documentType === "TR"
          ? {
              avoid: ["estudo de viabilidade de ETP", "clausulas de partes e foro da Minuta"],
              documentType,
              focusAreas: [
                "especificacoes",
                "execucao",
                "recebimento",
                "obrigacoes",
                "fiscalizacao",
                "pagamento",
                ...focusAreas,
              ],
              generationHints: [
                ...sharedHints,
                "Converter contexto em requisitos operacionais executaveis.",
                ...valueHint,
              ],
              recommendedDepth: planDepthFor(classification, documentType),
            }
          : {
              avoid: [
                "parecer juridico",
                "estudo tecnico",
                "headings de ETP ou TR",
                "dados inventados",
              ],
              documentType,
              focusAreas: [
                "clausulas contratuais",
                "partes",
                "objeto",
                "preco ou placeholder",
                "execucao",
                "obrigacoes",
                "fiscalizacao",
                "assinaturas",
              ],
              generationHints: [
                ...sharedHints,
                "Usar placeholders para dados ausentes.",
                ...valueHint,
              ],
              recommendedDepth: planDepthFor(classification, documentType),
            };

  return documentPlanSchema.parse(plan);
}

function toUpperDocumentType(documentType: GeneratedDocumentType): DocumentPlan["documentType"] {
  return documentType === "minuta"
    ? "MINUTA"
    : (documentType.toUpperCase() as DocumentPlan["documentType"]);
}

function buildDocumentPlans({
  classification,
  facts,
}: {
  classification: ProcurementClassification;
  facts: ExtractedSdFacts;
}) {
  return {
    DFD: buildDocumentPlan({ classification, documentType: "DFD", facts }),
    ETP: buildDocumentPlan({ classification, documentType: "ETP", facts }),
    MINUTA: buildDocumentPlan({ classification, documentType: "MINUTA", facts }),
    TR: buildDocumentPlan({ classification, documentType: "TR", facts }),
  };
}

export function enrichDocumentGenerationContext({
  departments,
  documentType,
  facts,
  organization,
  process,
  responsibleUserName,
}: {
  departments: StoredDepartment[];
  documentType: GeneratedDocumentType;
  facts: ExtractedSdFacts;
  organization: StoredOrganization;
  process: StoredProcess;
  responsibleUserName: string | null;
}) {
  const primaryDepartment = [...departments].sort((left, right) =>
    `${left.budgetUnitCode ?? ""}:${left.name}`.localeCompare(
      `${right.budgetUnitCode ?? ""}:${right.name}`,
    ),
  )[0];
  const extractedFields = getExtractedFields(process);
  const classification = classifyProcurement({ facts, process });
  const documentPlans = buildDocumentPlans({ classification, facts });
  const currentDocumentPlan = documentPlans[toUpperDocumentType(documentType)];
  const context = enrichedContextPackageSchema.parse({
    alternatives: buildAlternatives(classification),
    classification,
    documentPlan: currentDocumentPlan,
    documentPlans,
    facts,
    generationHints: currentDocumentPlan.generationHints,
    inferences: buildInferences({ classification, facts }),
    pendingIssues: buildPendingIssues({ classification, facts }),
    recommendedTone: getRecommendedTone(classification),
    risks: buildRisks({ classification, facts }),
    semanticObject: buildSemanticObject({ classification, facts }),
    source: {
      department: firstText(
        primaryDepartment?.name,
        getNestedText(extractedFields, "budgetUnitName"),
      ),
      issuedAt: process.issuedAt.toISOString(),
      organization: firstText(organization.officialName, organization.name),
      processNumber: process.processNumber,
      requestId: firstText(
        getNestedText(extractedFields, "requestNumber"),
        process.sourceReference,
        process.externalId,
      ),
      responsibleName: firstText(
        responsibleUserName,
        process.responsibleName,
        getNestedText(extractedFields, "responsibleName"),
        primaryDepartment?.responsibleName,
      ),
      responsibleRole: firstText(
        getNestedText(extractedFields, "responsibleRole"),
        primaryDepartment?.responsibleRole,
      ),
    },
  });

  return context;
}

function buildDocumentWriterPrompt({
  baseInput,
  context,
  plan,
  skillContract,
  writerStyle,
}: {
  baseInput: BuildPipelineInput;
  context: EnrichedContextPackage;
  plan: DocumentPlan;
  skillContract: SdDocumentIntelligenceContract;
  writerStyle: WriterStyle;
}) {
  const basePrompt = buildDocumentGenerationPrompt(baseInput);
  const styleGuidance = getWriterStyleGuidance(writerStyle);

  return [
    basePrompt,
    "",
    skillContract.promptBlock,
    "",
    "## Pacote de contexto enriquecido canonico",
    "Use este pacote como a camada de inteligencia documental. Fatos, inferencias e pendencias estao separados; nao promova inferencia a fato.",
    "```json",
    JSON.stringify(context, null, 2),
    "```",
    "",
    "## Plano documental especifico",
    "```json",
    JSON.stringify(plan, null, 2),
    "```",
    "",
    "## Estilo de redação",
    `Estilo selecionado: ${writerStyle}.`,
    styleGuidance,
    "",
    "## Regras compartilhadas do pipeline",
    "- A extracao factual ja foi realizada; nao reextraia nem invente dados.",
    "- A classificacao semantica ja foi definida antes das inferencias; use-a para calibrar profundidade, riscos e alternativas.",
    "- Valor zero, 0,00, 0.00 ou R$ 0,00 e ausencia de estimativa/preco valido.",
    "- Use pendencias como pendencias revisaveis, nao como fatos preenchidos.",
    "- Mantenha o papel do documento solicitado e evite headings de outros tipos documentais.",
    "- A inteligencia administrativa deve orientar a escrita sem aparecer como metalinguagem no documento final.",
    "- Varie naturalmente a profundidade das secoes: nem todo topico precisa receber o mesmo volume textual.",
  ].join("\n");
}

function getWriterStyleGuidance(writerStyle: WriterStyle) {
  if (writerStyle === "dry_legal") {
    return [
      "- Use redação contratual seca, direta e pouco explicativa.",
      "- Prefira cláusulas curtas, placeholders preservados e obrigações claras.",
      "- Evite justificativas técnicas, estudos de viabilidade e encerramentos longos.",
    ].join("\n");
  }

  if (writerStyle === "operational") {
    return [
      "- Use linguagem prática, executável e fiscalizável.",
      "- Desenvolva mais especificações, execução, recebimento, obrigações, fiscalização e pagamento.",
      "- Mantenha seções acessórias curtas quando bastar redação seca.",
    ].join("\n");
  }

  if (writerStyle === "technical") {
    return [
      "- Use análise técnica proporcional, com foco em escopo, entregáveis, evidências e fiscalização.",
      "- Dê mais densidade às seções que sustentam execução recorrente ou especializada.",
      "- Evite simetria artificial entre tópicos simples e pontos materialmente relevantes.",
    ].join("\n");
  }

  if (writerStyle === "institutional") {
    return [
      "- Use redação administrativa com sensibilidade institucional e finalidade pública clara.",
      "- Desenvolva controles, público-alvo, distribuição, calendário ou comprovação quando forem relevantes.",
      "- Evite linguagem promocional e excesso de cautela explícita.",
    ].join("\n");
  }

  return [
    "- Use redação administrativa objetiva, natural e revisável.",
    "- Mantenha proporcionalidade e seções de tamanho variado conforme relevância.",
    "- Evite completude mecânica em objetos simples.",
  ].join("\n");
}

export function createInitialDocumentGenerationPipeline(
  input: BuildPipelineInput & { debugRequested?: boolean },
) {
  const skillContract = loadSdDocumentIntelligenceContract();
  const extractedFacts = extractDocumentGenerationFacts({
    process: input.process,
    processItems: input.processItems,
  });
  const enrichedContext = enrichDocumentGenerationContext({
    departments: input.departments,
    documentType: input.documentType,
    facts: extractedFacts,
    organization: input.organization,
    process: input.process,
    responsibleUserName: input.responsibleUserName,
  });
  const documentPlan = enrichedContext.documentPlan;
  const writerStyle = deriveWriterStyle({
    classification: enrichedContext.classification,
    documentType: input.documentType,
  });
  const prompt = buildDocumentWriterPrompt({
    baseInput: input,
    context: enrichedContext,
    plan: documentPlan,
    skillContract,
    writerStyle,
  });

  return {
    debug: documentGenerationPipelineDebugSchema.parse({
      documentPlan,
      enrichedContext,
      extractedFacts,
      reviewResults: [],
      rewriteAttempts: [],
      skillContract: skillContract.metadata,
      status: "planned",
      writerStyle,
    }),
    pipeline: {
      debugRequested: Boolean(input.debugRequested),
      documentPlan,
      enrichedContext,
      extractedFacts,
      prompt,
      skillContract: skillContract.metadata,
      writerStyle,
    },
  };
}

function hasWrongDocumentRole(documentType: GeneratedDocumentType, normalizedText: string) {
  if (documentType === "dfd") {
    return /\b(estudo tecnico preliminar|termo de referencia|minuta|clausula primeira)\b/.test(
      normalizedText,
    );
  }

  if (documentType === "etp") {
    return /\b(documento de formalizacao de demanda|termo de referencia|minuta do contrato|clausula primeira)\b/.test(
      normalizedText,
    );
  }

  if (documentType === "tr") {
    return /\b(documento de formalizacao de demanda|estudo tecnico preliminar|minuta do contrato|clausula primeira)\b/.test(
      normalizedText,
    );
  }

  return /\b(documento de formalizacao de demanda|estudo tecnico preliminar|termo de referencia|levantamento de mercado|analise de alternativas)\b/.test(
    normalizedText,
  );
}

function hasZeroValueAsPrice(normalizedText: string) {
  return /\br\$\s*0+(?:[,.]0{1,2})?\b|\bvalor(?:\s+\w+){0,4}\s+0(?:[,.]0{1,2})?\b/.test(
    normalizedText,
  );
}

function hasPositiveCurrencyAmount(text: string) {
  return /\bR\$\s*(?!XX\b)(?!0+(?:[,.]0{1,2})?\b)\d[\d.]*,\d{2}\b/i.test(text);
}

function countRepeatedMeaningfulLines(text: string) {
  const counts = new Map<string, number>();

  for (const line of text.split(/\r?\n/)) {
    const normalized = normalizeSearchText(line);

    if (normalized.length < 24) {
      continue;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.values()].filter((count) => count > 1).length;
}

function hasMetaLanguage(normalizedText: string) {
  return [
    /\bna ausencia de contexto\b/,
    /\bo contexto nao apresenta\b/,
    /\bquando informado\b/,
    /\bquando suportado\b/,
    /\bnao foi identificado\b/,
    /\bnao constam informacoes\b/,
    /\bdados nao encontrados\b/,
    /\bcaso existente\b/,
    /\bconforme contexto fornecido\b/,
    /\bpacote de contexto\b/,
    /\bpipeline\b/,
  ].some((pattern) => pattern.test(normalizedText));
}

function countDefensiveCaution(normalizedText: string) {
  return [
    /\bdevera ser confirmado\b/g,
    /\bdevera ser alinhad[oa]\b/g,
    /\bdevera ser consolidado\b/g,
    /\bdesde que\b/g,
    /\bpodera\b/g,
    /\bpendente de confirmacao\b/g,
    /\ba definir\b/g,
  ].reduce((total, pattern) => total + [...normalizedText.matchAll(pattern)].length, 0);
}

function getItemCoverageIssue({ draft, facts }: { draft: string; facts: ExtractedSdFacts }) {
  if (facts.items.length === 0) {
    return null;
  }

  const normalizedDraft = normalizeSearchText(draft);
  const covered = facts.items.some((item) => {
    const candidate = normalizeSearchText(item.title ?? item.description)
      .split(" ")
      .filter((part) => part.length >= 4)
      .slice(0, 3);

    return candidate.length > 0 && candidate.some((part) => normalizedDraft.includes(part));
  });

  return covered
    ? null
    : {
        instruction:
          "Inclua referencia proporcional aos itens ou grupos de itens existentes na SD/processo.",
        problem: "O documento nao demonstra uso claro da lista de itens extraida.",
        section: "contexto do objeto",
        severity: "low" as const,
        type: "missing_context" as const,
      };
}

export function reviewGeneratedDocumentDraft({
  context,
  documentType,
  draft,
  plan,
  skillContract,
  writerStyle,
}: {
  context: EnrichedContextPackage;
  documentType: GeneratedDocumentType;
  draft: string;
  plan: DocumentPlan;
  skillContract?: SdDocumentIntelligenceContractMetadata;
  writerStyle?: WriterStyle;
}) {
  const normalizedText = normalizeSearchText(draft);
  const issues: DocumentReviewIssue[] = [];

  if (hasWrongDocumentRole(documentType, normalizedText)) {
    issues.push({
      instruction:
        "Remova secoes ou headings de outros tipos documentais e mantenha apenas o papel solicitado.",
      problem: "O documento contem sinais estruturais de outro tipo documental.",
      section: "estrutura",
      severity: "high",
      type: "wrong_document_role",
    });
  }

  if (!context.facts.hasValidEstimatedValue && hasZeroValueAsPrice(normalizedText)) {
    issues.push({
      instruction: "Substitua o valor zerado por indicacao de ausencia de estimativa/preco valido.",
      problem: "Valor zero aparece como se fosse preco ou estimativa valida.",
      section: "valor",
      severity: "high",
      type: "invalid_value_handling",
    });
  }

  if (!context.facts.hasValidEstimatedValue && hasPositiveCurrencyAmount(draft)) {
    issues.push({
      instruction:
        "Remova valor monetario sem lastro e use placeholder ou providencia de apuracao propria.",
      problem: "O documento apresenta valor monetario positivo sem estimativa valida no contexto.",
      section: "valor",
      severity: "high",
      type: "invalid_value_handling",
    });
  }

  const itemCoverageIssue = getItemCoverageIssue({ draft, facts: context.facts });

  if (itemCoverageIssue) {
    issues.push(itemCoverageIssue);
  }

  if (/\brascunho gerado automaticamente\b|\bavaliacao interna\b/.test(normalizedText)) {
    issues.push({
      instruction:
        "Substitua texto generico por redacao documental contextualizada com base no pacote enriquecido.",
      problem: "O texto ainda parece uma resposta generica de sistema.",
      section: "texto geral",
      severity: "medium",
      type: "generic_text",
    });
  }

  if (countRepeatedMeaningfulLines(draft) >= 2) {
    issues.push({
      instruction:
        "Reduza repeticoes literais e consolide ideias equivalentes em paragrafos mais naturais.",
      problem: "Ha repeticao excessiva de linhas ou frases longas.",
      section: "texto geral",
      severity: "low",
      type: "excessive_repetition",
    });
  }

  if (hasMetaLanguage(normalizedText)) {
    issues.push({
      instruction:
        "Remova metalinguagem sobre contexto, pipeline ou dados nao encontrados; use placeholder, omissao natural ou redacao institucional seca.",
      problem: "O documento verbaliza mecanismos internos de cautela ou ausencia de dados.",
      section: "texto geral",
      severity: "medium",
      type: "meta_language",
    });
  }

  const defensiveCautionCount = countDefensiveCaution(normalizedText);

  if (defensiveCautionCount >= 3 || (writerStyle === "dry_legal" && defensiveCautionCount >= 1)) {
    issues.push({
      instruction:
        "Reduza cautela explicita e transforme condicionamentos repetidos em clausula seca, placeholder ou providencia administrativa objetiva.",
      problem:
        "O texto usa condicionamentos e ressalvas em excesso, deixando a redacao defensiva demais.",
      section: "texto geral",
      severity: "medium",
      type: "excessive_defensiveness",
    });
  }

  if (
    (documentType === "dfd" || documentType === "etp" || documentType === "tr") &&
    /^(#{1,6}\s*)?(fecho|assinatura)\b/im.test(draft)
  ) {
    issues.push({
      instruction:
        "Remova heading de fecho/assinatura e mantenha apenas local, nome e cargo em linhas simples.",
      problem: "O bloco de assinatura usa heading indevido.",
      section: "assinatura",
      severity: "medium",
      type: "signature_problem",
    });
  }

  if (documentType === "minuta") {
    const minutaStructure = analyzeMinutaClauseStructure(draft);

    for (const duplicatedTopic of minutaStructure.duplicateFixedTopics) {
      issues.push({
        instruction: `Mantenha apenas uma cláusula fixa para ${duplicatedTopic.topicLabel}, usando a versão canônica do template.`,
        problem: `A Minuta contém cláusulas equivalentes duplicadas: ${duplicatedTopic.headings.join(
          " | ",
        )}.`,
        section: "cláusulas fixas da minuta",
        severity: "high",
        type: "template_violation",
      });
    }

    if (minutaStructure.hasClosingBeforeLaterClause) {
      issues.push({
        instruction:
          "Reposicione o fecho e as assinaturas para depois de todas as cláusulas contratuais, mantendo um único bloco final.",
        problem: "O fecho ou as assinaturas aparecem antes de cláusulas contratuais posteriores.",
        section: "assinaturas da minuta",
        severity: "high",
        type: "signature_problem",
      });
    }

    if (
      minutaStructure.aliasFixedClauseHeadings.length > 0 &&
      minutaStructure.duplicateFixedTopics.length === 0
    ) {
      issues.push({
        instruction:
          "Substitua títulos alternativos de cláusulas fixas pelos títulos canônicos do template da Minuta.",
        problem: `A Minuta usa título alternativo para cláusula fixa: ${minutaStructure.aliasFixedClauseHeadings
          .map((item) => `${item.heading} -> ${item.canonicalHeading}`)
          .join(" | ")}.`,
        section: "cláusulas fixas da minuta",
        severity: "medium",
        type: "template_violation",
      });
    }
  }

  if (plan.recommendedDepth === "simplified" && documentType === "dfd" && draft.length > 9000) {
    issues.push({
      instruction: "Enxugue o DFD para formalizacao inicial, removendo analises desnecessarias.",
      problem: "O DFD esta longo demais para o papel documental.",
      section: "profundidade",
      severity: "medium",
      type: "excessive_depth",
    });
  }

  if (
    skillContract?.documentRoles[toUpperDocumentType(documentType)] &&
    !skillContract.stageOrder.includes("classify_semantically")
  ) {
    issues.push({
      instruction: "Reprocesse a geração com o contrato runtime sd-document-intelligence completo.",
      problem: "O contrato runtime informado não preserva a etapa de classificação semântica.",
      section: "contrato runtime",
      severity: "high",
      type: "template_violation",
    });
  }

  const highCount = issues.filter((issue) => issue.severity === "high").length;
  const mediumCount = issues.filter((issue) => issue.severity === "medium").length;
  const lowCount = issues.filter((issue) => issue.severity === "low").length;
  const score = Math.max(
    0,
    Number((0.95 - highCount * 0.28 - mediumCount * 0.14 - lowCount * 0.05).toFixed(2)),
  );
  const result = documentReviewResultSchema.parse({
    globalRevisionInstructions: issues.map((issue) => issue.instruction),
    issues,
    score,
    status: issues.some((issue) => issue.severity === "high" || issue.severity === "medium")
      ? "needs_revision"
      : "approved",
  });

  return result;
}

function buildRewritePrompt({
  context,
  currentDraft,
  documentType,
  plan,
  review,
  skillContract,
  writerStyle,
}: {
  context: EnrichedContextPackage;
  currentDraft: string;
  documentType: GeneratedDocumentType;
  plan: DocumentPlan;
  review: DocumentReviewResult;
  skillContract: SdDocumentIntelligenceContract;
  writerStyle: WriterStyle;
}) {
  return [
    "Voce e o Final Rewrite Agent do pipeline documental.",
    "Reescreva de forma direcionada o documento atual, aplicando apenas os ajustes pedidos na revisao estruturada.",
    "Nao recomece do zero se o documento atual puder ser aproveitado.",
    "Retorne somente o Markdown final revisado.",
    "",
    `Tipo documental: ${documentType.toUpperCase()}`,
    `Estilo de redação: ${writerStyle}`,
    `Contrato sd-document-intelligence: ${skillContract.metadata.version} (${skillContract.metadata.contractDigest})`,
    "",
    "## Documento atual",
    currentDraft,
    "",
    "## Resultado da revisao",
    "```json",
    JSON.stringify(review, null, 2),
    "```",
    "",
    "## Plano documental",
    "```json",
    JSON.stringify(plan, null, 2),
    "```",
    "",
    skillContract.promptBlock,
    "",
    "## Contexto enriquecido",
    "```json",
    JSON.stringify(context, null, 2),
    "```",
    "",
    "## Regras",
    "- Corrija os problemas apontados sem inventar dados.",
    "- Preserve dados confirmados, itens e pendencias do contexto.",
    "- Valor zero deve permanecer como ausencia de estimativa/preco valido.",
    "- Mantenha o papel documental solicitado.",
    "- Remova metalinguagem, cautela verbalizada e explicacoes sobre dados ausentes quando o mesmo efeito puder ser obtido por placeholder, omissao natural ou frase institucional seca.",
    ...(documentType === "minuta"
      ? [
          "- Para Minuta, preserve a cauda contratual canônica: prerrogativas, alteração e reajuste, condições de habilitação, publicidade, casos omissos e foro.",
          "- Não crie versão alternativa dessas cláusulas fixas nem mantenha duas cláusulas com o mesmo tema contratual.",
          "- O fecho, assinaturas e testemunhas devem aparecer uma única vez, sempre depois da última cláusula.",
        ]
      : []),
  ].join("\n");
}

function buildHumanizationPrompt({
  context,
  documentType,
  draft,
  plan,
  skillContract,
  writerStyle,
}: {
  context: EnrichedContextPackage;
  documentType: GeneratedDocumentType;
  draft: string;
  plan: DocumentPlan;
  skillContract: SdDocumentIntelligenceContract;
  writerStyle: WriterStyle;
}) {
  return [
    "Voce e o Humanization Pass do pipeline documental.",
    "Refine a superficie textual do documento sem alterar fatos, valores, itens, placeholders, estrutura obrigatoria ou papel documental.",
    "Retorne somente o Markdown revisado.",
    "",
    `Tipo documental: ${documentType.toUpperCase()}`,
    `Estilo de redacao: ${writerStyle}`,
    `Contrato sd-document-intelligence: ${skillContract.metadata.version} (${skillContract.metadata.contractDigest})`,
    "",
    "## Documento a humanizar",
    draft,
    "",
    "## Plano documental",
    "```json",
    JSON.stringify(plan, null, 2),
    "```",
    "",
    skillContract.promptBlock,
    "",
    "## Contexto enriquecido",
    "```json",
    JSON.stringify(context, null, 2),
    "```",
    "",
    "## Ajustes de superficie",
    "- Remova metalinguagem sobre contexto, pipeline, classificacao, inferencia, confianca ou dados nao encontrados.",
    "- Troque cautela verbalizada por placeholder, omissao natural ou frase institucional curta.",
    "- Reduza repeticao semantica, simetria artificial e encerramentos excessivamente completos.",
    "- Varie a densidade das secoes: topicos simples podem ser secos; topicos materiais podem permanecer robustos.",
    "- Preserve seguranca juridica, placeholders, valor zerado como ausencia de estimativa/preco valido e clausulas FIXED da Minuta.",
    "- Nao acrescente fornecedor, valor, data, local, dotacao, prazo, legal path, pesquisa realizada ou detalhe operacional ausente.",
    "- Nao converta DFD em ETP, ETP em TR, TR em Minuta ou Minuta em estudo tecnico.",
  ].join("\n");
}

function createSubject({
  documentId,
  organizationId,
  processId,
}: {
  documentId: string;
  organizationId: string;
  processId: string;
}) {
  return {
    documentId,
    organizationId,
    processId,
  };
}

function createPipelineResponseMetadata({
  calls,
  debug,
  debugRequested,
  providerMetadata,
}: {
  calls?: DocumentGenerationPipelineCallMetadata[];
  debug: DocumentGenerationPipelineDebug | null;
  debugRequested: boolean;
  providerMetadata: Record<string, unknown>;
}) {
  if (!debug) {
    return providerMetadata;
  }

  const lastReview = debug.reviewResults.at(-1) ?? null;
  const pipelineCalls = calls ?? [];
  const summary = {
    ...createPipelineCallAggregate(pipelineCalls),
    calls: pipelineCalls,
    classification: debug.enrichedContext.classification,
    finalReviewStatus: lastReview?.status ?? null,
    finalReviewScore: lastReview?.score ?? null,
    revisionCount: debug.rewriteAttempts.length,
    status: debug.status,
  };

  return {
    ...providerMetadata,
    pipeline: debugRequested ? { ...summary, debug } : summary,
  };
}

function getNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNullableCostUsd(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createPipelineCallMetadata({
  result,
  stage,
}: {
  result: TextGenerationResult;
  stage: DocumentGenerationPipelineCallStage;
}): DocumentGenerationPipelineCallMetadata {
  return {
    costUsd: getNullableCostUsd(result.responseMetadata.costUsd),
    model: result.model,
    providerKey: result.providerKey,
    responseId: getNullableString(result.responseMetadata.responseId),
    stage,
    usage: normalizeTextGenerationUsage(result.responseMetadata.usage),
  };
}

function roundPipelineCostUsd(value: number) {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function createPipelineCallAggregate(calls: DocumentGenerationPipelineCallMetadata[]) {
  const hasUnknownCost = calls.some((call) => call.costUsd == null);
  const totalCostUsd = hasUnknownCost
    ? null
    : calls.reduce((total, call) => total + (call.costUsd ?? 0), 0);

  return {
    callCount: calls.length,
    totalCachedInputTokens: calls.reduce(
      (total, call) => total + call.usage.input_tokens_details.cached_tokens,
      0,
    ),
    totalCostUsd: totalCostUsd == null ? null : roundPipelineCostUsd(totalCostUsd),
    totalInputTokens: calls.reduce((total, call) => total + call.usage.input_tokens, 0),
    totalOutputTokens: calls.reduce((total, call) => total + call.usage.output_tokens, 0),
    totalTokens: calls.reduce((total, call) => total + call.usage.total_tokens, 0),
  };
}

function parseStoredPipeline(value: unknown): InitialDocumentGenerationPipeline | null {
  if (!isRecord(value) || typeof value.prompt !== "string") {
    return null;
  }

  const extractedFacts = extractedSdFactsSchema.safeParse(value.extractedFacts);
  const enrichedContext = enrichedContextPackageSchema.safeParse(value.enrichedContext);
  const documentPlan = documentPlanSchema.safeParse(value.documentPlan);
  const skillContract = sdDocumentIntelligenceContractMetadataSchema.safeParse(value.skillContract);
  const writerStyle = writerStyleSchema.safeParse(value.writerStyle);

  if (
    !extractedFacts.success ||
    !enrichedContext.success ||
    !documentPlan.success ||
    !skillContract.success
  ) {
    return null;
  }

  try {
    assertSdDocumentIntelligenceContractMetadataCurrent(skillContract.data);
  } catch {
    return null;
  }

  const parsedWriterStyle = writerStyle.success
    ? writerStyle.data
    : deriveWriterStyle({
        classification: enrichedContext.data.classification,
        documentType:
          documentPlan.data.documentType === "MINUTA"
            ? "minuta"
            : (documentPlan.data.documentType.toLowerCase() as GeneratedDocumentType),
      });

  return {
    debugRequested: value.debugRequested === true,
    documentPlan: documentPlan.data,
    enrichedContext: enrichedContext.data,
    extractedFacts: extractedFacts.data,
    prompt: value.prompt,
    skillContract: skillContract.data,
    writerStyle: parsedWriterStyle,
  };
}

export function getStoredPipelineFromMetadata(metadata: Record<string, unknown>) {
  return parseStoredPipeline(metadata.pipeline);
}

export async function executeDocumentGenerationPipeline({
  documentId,
  documentType,
  onChunk,
  onPlanningChunk,
  organizationId,
  pipeline,
  pipelineRequired = false,
  processId,
  prompt,
  textGeneration,
}: ExecutePipelineInput): Promise<ExecutedDocumentGenerationPipeline> {
  const subject = createSubject({ documentId, organizationId, processId });

  if (!pipeline) {
    if (pipelineRequired) {
      throw new TextGenerationError({
        code: "invalid_request",
        details: {
          contract: "sd-document-intelligence",
          reason: "missing_or_stale_pipeline_contract",
        },
        message:
          "SD-backed document generation requires a valid runtime sd-document-intelligence contract.",
        model: textGeneration.model,
        providerKey: textGeneration.providerKey,
      });
    }

    const result = await textGeneration.generateText({
      documentType,
      onChunk,
      onPlanningChunk,
      prompt,
      subject,
    });

    return {
      ...result,
      text: sanitizeGeneratedDocumentDraft({ documentType, text: result.text }),
    };
  }

  let runtimeSkillContract: SdDocumentIntelligenceContract;

  try {
    runtimeSkillContract = loadSdDocumentIntelligenceContract();
    assertSdDocumentIntelligenceContractMetadataCurrent(pipeline.skillContract);

    if (runtimeSkillContract.metadata.contractDigest !== pipeline.skillContract.contractDigest) {
      throw new Error("Persisted contract digest differs from runtime contract digest.");
    }
  } catch (error) {
    throw new TextGenerationError({
      code: "invalid_request",
      details: {
        contract: "sd-document-intelligence",
        reason: error instanceof Error ? error.message : "contract_unavailable",
      },
      message:
        "SD-backed document generation requires a valid runtime sd-document-intelligence contract.",
      model: textGeneration.model,
      providerKey: textGeneration.providerKey,
    });
  }

  const writerResult = await textGeneration.generateText({
    documentType,
    onChunk,
    onPlanningChunk,
    prompt: pipeline.prompt,
    subject,
  });
  const pipelineCalls: DocumentGenerationPipelineCallMetadata[] = [
    createPipelineCallMetadata({ result: writerResult, stage: "writer" }),
  ];
  let finalResult: TextGenerationResult = writerResult;
  const firstDraft = sanitizeGeneratedDocumentDraft({
    documentType,
    text: writerResult.text,
  });
  let currentDraft = firstDraft;
  let humanization: DocumentHumanizationResult = {
    draft: null,
    reason: null,
    status: "skipped",
  };

  try {
    const humanizationResult = await textGeneration.generateText({
      documentType,
      prompt: buildHumanizationPrompt({
        context: pipeline.enrichedContext,
        documentType,
        draft: currentDraft,
        plan: pipeline.documentPlan,
        skillContract: runtimeSkillContract,
        writerStyle: pipeline.writerStyle,
      }),
      subject,
    });
    pipelineCalls.push(
      createPipelineCallMetadata({ result: humanizationResult, stage: "humanization" }),
    );
    const humanizedDraft = sanitizeGeneratedDocumentDraft({
      documentType,
      text: humanizationResult.text,
    });

    if (humanizedDraft.length > 0) {
      currentDraft = humanizedDraft;
      finalResult = humanizationResult;
      humanization = {
        draft: currentDraft,
        reason: null,
        status: "applied",
      };
    } else {
      humanization = {
        draft: null,
        reason: "Humanization Pass returned an empty draft.",
        status: "skipped",
      };
    }
  } catch (error) {
    humanization = {
      draft: null,
      reason: error instanceof Error ? error.message : "Humanization Pass failed.",
      status: "failed",
    };
  }

  const reviewResults: DocumentReviewResult[] = [];
  const rewriteAttempts: DocumentGenerationPipelineDebug["rewriteAttempts"] = [];

  for (let index = 0; index <= MAX_DOCUMENT_REWRITE_CYCLES; index += 1) {
    const review = reviewGeneratedDocumentDraft({
      context: pipeline.enrichedContext,
      documentType,
      draft: currentDraft,
      plan: pipeline.documentPlan,
      skillContract: pipeline.skillContract,
      writerStyle: pipeline.writerStyle,
    });

    reviewResults.push(review);

    if (review.status === "approved" || rewriteAttempts.length >= MAX_DOCUMENT_REWRITE_CYCLES) {
      break;
    }

    const rewriteResult = await textGeneration.generateText({
      documentType,
      prompt: buildRewritePrompt({
        context: pipeline.enrichedContext,
        currentDraft,
        documentType,
        plan: pipeline.documentPlan,
        review,
        skillContract: runtimeSkillContract,
        writerStyle: pipeline.writerStyle,
      }),
      subject,
    });

    finalResult = rewriteResult;
    pipelineCalls.push(createPipelineCallMetadata({ result: rewriteResult, stage: "rewrite" }));
    currentDraft = sanitizeGeneratedDocumentDraft({
      documentType,
      text: rewriteResult.text,
    });
    rewriteAttempts.push({
      draft: currentDraft,
      review,
      revisionNumber: rewriteAttempts.length + 1,
    });
  }

  const debug = documentGenerationPipelineDebugSchema.parse({
    documentPlan: pipeline.documentPlan,
    enrichedContext: pipeline.enrichedContext,
    extractedFacts: pipeline.extractedFacts,
    finalDraft: currentDraft,
    firstDraft,
    humanization,
    reviewResults,
    rewriteAttempts,
    skillContract: pipeline.skillContract,
    status: "completed",
    writerStyle: pipeline.writerStyle,
  });

  return {
    model: finalResult.model,
    providerKey: finalResult.providerKey,
    responseMetadata: createPipelineResponseMetadata({
      calls: pipelineCalls,
      debug,
      debugRequested: pipeline.debugRequested,
      providerMetadata: finalResult.responseMetadata,
    }),
    text: currentDraft,
  };
}
