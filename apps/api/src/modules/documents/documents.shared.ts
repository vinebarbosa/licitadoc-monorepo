import { eq, type SQL } from "drizzle-orm";
import type { Actor } from "../../authorization/actor";
import type { departments, organizations, processes } from "../../db";
import { documents } from "../../db";
import type { GeneratedDocumentType } from "../../shared/text-generation/types";
import type { SerializedProcessItem } from "../processes/processes.shared";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";

export type StoredDocument = typeof documents.$inferSelect;
export type StoredDepartment = typeof departments.$inferSelect;
export type StoredOrganization = typeof organizations.$inferSelect;
export type StoredProcess = typeof processes.$inferSelect;
export type SourceItemForGeneration = {
  code: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
};
type ProcessGenerationExtras = {
  processItems?: SerializedProcessItem[];
  responsibleUserName?: string | null;
};

export function getDocumentsVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(documents.organizationId, actor.organizationId);
}

export function serializeDocumentSummary(document: StoredDocument, process?: StoredProcess) {
  return {
    id: document.id,
    name: document.name,
    organizationId: document.organizationId,
    processId: document.processId,
    processNumber: process?.processNumber ?? null,
    type: document.type,
    status: document.status,
    responsibles: document.responsibles,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function serializeDocumentDetail(document: StoredDocument) {
  return {
    ...serializeDocumentSummary(document),
    draftContent: document.draftContent ?? null,
    storageKey: document.storageKey ?? null,
    responsibles: document.responsibles,
  };
}

export function getGeneratedDocumentName(
  documentType: GeneratedDocumentType,
  process: StoredProcess,
) {
  return `${documentType.toUpperCase()} - ${process.processNumber}`;
}

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
  if (typeof value !== "string") {
    return null;
  }

  const next = normalizeText(value);

  return next.length > 0 ? next : null;
}

function getNullableScalarText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return getNullableText(value);
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const next = getNullableText(value);

    if (next) {
      return next;
    }
  }

  return null;
}

function toDisplayText(value: string | null | undefined) {
  return firstText(value) ?? "não informado";
}

function formatDateBr(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(value);
}

function formatDateLongBr(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(value);
}

function getExtractedFields(process: StoredProcess) {
  if (!isRecord(process.sourceMetadata)) {
    return null;
  }

  const extractedFields = process.sourceMetadata.extractedFields;

  if (!isRecord(extractedFields)) {
    return null;
  }

  return extractedFields;
}

function getWarnings(process: StoredProcess) {
  if (!isRecord(process.sourceMetadata)) {
    return [];
  }

  const warnings = process.sourceMetadata.warnings;

  if (!Array.isArray(warnings)) {
    return [];
  }

  return warnings
    .map((warning) => getNullableText(warning))
    .filter((warning): warning is string => warning !== null);
}

function getExtractedTextField(process: StoredProcess, fieldName: string) {
  const extractedFields = getExtractedFields(process);

  if (!extractedFields) {
    return null;
  }

  return getNullableText(extractedFields[fieldName]);
}

function getExtractedValue(process: StoredProcess, fieldPath: string) {
  const extractedFields = getExtractedFields(process);

  if (!extractedFields) {
    return null;
  }

  let current: unknown = extractedFields;

  for (const segment of fieldPath.split(".")) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current);
  }

  return getNullableText(current);
}

function getCanonicalProcessItems(processItems: SerializedProcessItem[] = []): SourceItemForGeneration[] {
  return processItems.map((item) => ({
    code: item.code,
    description: firstText(item.description, item.title),
    quantity: item.quantity,
    totalValue: item.totalValue,
    unit: item.unit,
    unitValue: item.unitValue,
  }));
}

function getReviewedSourceItems(
  process: StoredProcess,
  processItems: SerializedProcessItem[] = [],
): SourceItemForGeneration[] {
  const canonicalItems = getCanonicalProcessItems(processItems);

  if (canonicalItems.length > 0) {
    return canonicalItems;
  }

  const extractedFields = getExtractedFields(process);

  if (!extractedFields || !Array.isArray(extractedFields.items)) {
    return [];
  }

  return extractedFields.items
    .map((item): SourceItemForGeneration | null => {
      if (!isRecord(item)) {
        return null;
      }

      const normalized = {
        code: firstText(
          getNullableScalarText(item.code),
          getNullableScalarText(item.itemCode),
          getNullableScalarText(item.codigo),
        ),
        description: firstText(
          getNullableScalarText(item.description),
          getNullableScalarText(item.itemDescription),
          getNullableScalarText(item.descricao),
        ),
        quantity: firstText(getNullableScalarText(item.quantity), getNullableScalarText(item.quantidade)),
        totalValue: firstText(
          getNullableScalarText(item.totalValue),
          getNullableScalarText(item.valorTotal),
        ),
        unit: firstText(getNullableScalarText(item.unit), getNullableScalarText(item.unidade)),
        unitValue: firstText(
          getNullableScalarText(item.unitValue),
          getNullableScalarText(item.valorUnitario),
        ),
      };
      const hasMeaningfulValue = Object.values(normalized).some((value) => value !== null);

      return hasMeaningfulValue ? normalized : null;
    })
    .filter((item): item is SourceItemForGeneration => item !== null);
}

function compactSourceItemDescription(value: string | null) {
  if (!value) {
    return null;
  }

  return value.length > 240 ? `${value.slice(0, 237).trimEnd()}...` : value;
}

function formatSourceItemLine(item: SourceItemForGeneration, index: number) {
  const identity = [item.code, compactSourceItemDescription(item.description)]
    .filter((value): value is string => Boolean(value))
    .join(" - ");
  const details = [
    [item.quantity, item.unit].filter((value): value is string => Boolean(value)).join(" ")
      ? `qtd. ${[item.quantity, item.unit].filter((value): value is string => Boolean(value)).join(" ")}`
      : null,
    item.unitValue ? `unitário ${item.unitValue}` : null,
    item.totalValue ? `total ${item.totalValue}` : null,
  ].filter((value): value is string => Boolean(value));

  return `  ${index + 1}. ${identity || "item sem descrição"}${
    details.length > 0 ? ` | ${details.join(" | ")}` : ""
  }`;
}

function formatSourceItemsSummary(items: SourceItemForGeneration[]) {
  if (items.length === 0) {
    return null;
  }

  return [
    `- Itens da SD revisados: ${items.length}`,
    "- Lista de itens da SD:",
    ...items.map(formatSourceItemLine),
  ].join("\n");
}

function getSourceItemsEvidenceText(items: SourceItemForGeneration[]) {
  return items
    .flatMap((item) => [item.code, item.description].filter((value): value is string => Boolean(value)))
    .join(" ");
}

function sourceItemPromptLines(
  context: {
    hasSourceItems: boolean;
    sourceItemsSummary: string | null;
    itemDescription: string | null;
    itemQuantity: string | null;
    itemUnit: string | null;
    itemUnitValue?: string | null;
  },
  label: "origem" | "SD",
) {
  if (context.hasSourceItems && context.sourceItemsSummary) {
    return context.sourceItemsSummary.split("\n");
  }

  const suffix = label === "origem" ? "da origem" : "da SD";
  const lines = [
    `- Descrição do item ${suffix}: ${toDisplayText(context.itemDescription)}`,
    `- Quantidade do item ${suffix}: ${toDisplayText(context.itemQuantity)}`,
    `- Unidade do item ${suffix}: ${toDisplayText(context.itemUnit)}`,
  ];

  if (label === "origem") {
    lines.push(`- Valor unitário extraído da origem: ${toDisplayText(context.itemUnitValue)}`);
  }

  return lines;
}

function getSourceMetadataValue(process: StoredProcess, fieldPath: string) {
  if (!isRecord(process.sourceMetadata)) {
    return null;
  }

  let current: unknown = process.sourceMetadata;

  for (const segment of fieldPath.split(".")) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current);
  }

  return getNullableText(current);
}

function compareDepartments(left: StoredDepartment, right: StoredDepartment) {
  return `${left.budgetUnitCode ?? ""}:${left.name}:${left.id}`.localeCompare(
    `${right.budgetUnitCode ?? ""}:${right.name}:${right.id}`,
  );
}

function formatDepartmentSummary(department: StoredDepartment) {
  const budgetUnitPrefix = department.budgetUnitCode ? `${department.budgetUnitCode} - ` : "";

  return `${budgetUnitPrefix}${department.name}`;
}

function normalizeMonetaryNumber(value: string) {
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

export function normalizeEtpEstimate(rawValue: string | null | undefined) {
  const value = firstText(rawValue);

  if (!value) {
    return {
      available: false,
      displayValue: "não informado",
      guidance: "Estimativa não informada no contexto; será objeto de apuração posterior.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "não informado",
      guidance:
        "Valor ausente ou informado como zero; tratar como ausência de estimativa e indicar apuração posterior.",
      rawValue: value,
    };
  }

  return {
    available: true,
    displayValue: value,
    guidance:
      "Estimativa disponível no contexto; usar somente este valor, sem extrapolar ou complementar.",
    rawValue: value,
  };
}

export function normalizeMinutaPrice(rawValue: string | null | undefined) {
  const value = firstText(rawValue);

  if (!value) {
    return {
      available: false,
      displayValue: "R$ XX.XXX,XX",
      guidance:
        "Preço não informado no contexto; manter placeholder e não simular valor contratual.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "R$ XX.XXX,XX",
      guidance:
        "Valor ausente ou informado como zero; tratar como ausência de preço e manter placeholder.",
      rawValue: value,
    };
  }

  return {
    available: true,
    displayValue: value,
    guidance: "Preço disponível no contexto; usar somente este valor, sem extrapolar.",
    rawValue: value,
  };
}

function buildGenericDocumentGenerationPrompt({
  documentType,
  instructions,
  organization,
  process,
  responsibleUserName = null,
}: {
  documentType: GeneratedDocumentType;
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  return [
    "Você é um assistente especializado em documentos administrativos e jurídicos para prefeituras brasileiras.",
    "Gere um rascunho claro, estruturado e revisável. Não declare aprovação jurídica final.",
    "",
    `Tipo de documento: ${documentType.toUpperCase()}`,
    "",
    "Dados da organização:",
    `Nome: ${organization.name}`,
    `Nome oficial: ${organization.officialName}`,
    `CNPJ: ${organization.cnpj}`,
    `Município/UF: ${organization.city}/${organization.state}`,
    `Autoridade: ${organization.authorityName} - ${organization.authorityRole}`,
    "",
    "Dados do processo:",
    `Método de contratação: ${process.procurementMethod ?? "não informado"}`,
    `Modalidade: ${process.biddingModality ?? "não informado"}`,
    `Número: ${process.processNumber}`,
    `Identificador externo: ${process.externalId ?? "não informado"}`,
    `Data de emissão: ${process.issuedAt.toISOString()}`,
    `Objeto: ${process.object}`,
    `Justificativa: ${process.justification}`,
    `Responsável: ${firstText(responsibleUserName, process.responsibleName) ?? "não informado"}`,
    `Status: ${process.status}`,
    "",
    "Instruções adicionais do operador:",
    instructions ?? "Nenhuma instrução adicional informada.",
  ].join("\n");
}

export function buildDfdGenerationContext({
  departments,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const sortedDepartments = [...departments].sort(compareDepartments);
  const primaryDepartment = sortedDepartments[0] ?? null;
  const sourceBudgetUnitName = getExtractedTextField(process, "budgetUnitName");
  const canonicalBudgetUnitName = primaryDepartment?.name ?? null;
  const canonicalOrganizationName = firstText(organization.officialName, organization.name);
  const sourceOrganizationName = getExtractedTextField(process, "organizationName");
  const sourceItems = getReviewedSourceItems(process, processItems);
  const hasSourceItems = sourceItems.length > 0;
  const rawEstimate = firstText(
    getExtractedValue(process, "totalValue"),
    getExtractedValue(process, "estimatedValue"),
    getExtractedValue(process, "estimateValue"),
    getExtractedValue(process, "contractValue"),
    getExtractedValue(process, "value"),
    hasSourceItems ? null : getExtractedValue(process, "item.totalValue"),
    hasSourceItems ? null : getExtractedValue(process, "item.unitValue"),
  );

  return {
    budgetUnitCode: firstText(
      getExtractedTextField(process, "budgetUnitCode"),
      primaryDepartment?.budgetUnitCode,
    ),
    budgetUnitName: firstText(canonicalBudgetUnitName, sourceBudgetUnitName),
    canonicalBudgetUnitName: firstText(canonicalBudgetUnitName),
    departmentSummary:
      sortedDepartments.length > 0
        ? sortedDepartments.map(formatDepartmentSummary).join("; ")
        : "nenhum departamento vinculado",
    estimate: normalizeEtpEstimate(rawEstimate),
    hasSourceItems,
    issueDateBr: formatDateBr(process.issuedAt),
    issueDateLongBr: formatDateLongBr(process.issuedAt),
    itemDescription: firstText(
      getExtractedValue(process, "item.description"),
      getExtractedValue(process, "itemDescription"),
    ),
    itemQuantity: firstText(getExtractedValue(process, "item.quantity")),
    itemTotalValue: firstText(getExtractedValue(process, "item.totalValue")),
    itemUnit: firstText(getExtractedValue(process, "item.unit")),
    itemUnitValue: firstText(getExtractedValue(process, "item.unitValue")),
    object: firstText(getExtractedTextField(process, "object"), process.object),
    organizationCnpj: firstText(
      getExtractedTextField(process, "organizationCnpj"),
      organization.cnpj,
    ),
    organizationName: firstText(canonicalOrganizationName, sourceOrganizationName),
    processJustification: firstText(process.justification),
    processType: firstText(
      process.procurementMethod,
      process.biddingModality,
      getExtractedTextField(process, "processType"),
      process.type,
    ),
    requestNumber: firstText(getExtractedTextField(process, "requestNumber"), process.externalId),
    requester: firstText(
      canonicalBudgetUnitName,
      sourceBudgetUnitName,
      canonicalOrganizationName,
      organization.name,
    ),
    responsibleName: firstText(
      responsibleUserName,
      process.responsibleName,
      getExtractedTextField(process, "responsibleName"),
      primaryDepartment?.responsibleName,
    ),
    responsibleRole: firstText(
      getExtractedTextField(process, "responsibleRole"),
      primaryDepartment?.responsibleRole,
    ),
    sourceBudgetUnitName,
    sourceItems,
    sourceItemsCount: sourceItems.length,
    sourceItemsEvidenceText: getSourceItemsEvidenceText(sourceItems),
    sourceItemsSummary: formatSourceItemsSummary(sourceItems),
    sourceKind: firstText(process.sourceKind),
    sourceLabel: firstText(
      getSourceMetadataValue(process, "source.label"),
      getSourceMetadataValue(process, "source.fileName"),
      getSourceMetadataValue(process, "sourceFile.fileName"),
    ),
    sourceOrganizationName,
    sourceReference: firstText(process.sourceReference),
    warnings: getWarnings(process),
  };
}

export function buildEtpGenerationContext({
  departments,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const dfdContext = buildDfdGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const estimate = dfdContext.estimate;
  const itemDescription = firstText(getExtractedValue(process, "item.description"));
  const processJustification = firstText(process.justification);
  const itemEvidenceText = dfdContext.hasSourceItems
    ? dfdContext.sourceItemsEvidenceText
    : itemDescription;
  const itemAnalysisProfile = itemEvidenceText
    ? inferContractingAnalysisProfile(itemEvidenceText)
    : null;
  const processAnalysisProfile = inferContractingAnalysisProfile(
    [dfdContext.object, itemEvidenceText, processJustification, dfdContext.processType]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );
  const analysisProfile =
    itemAnalysisProfile && itemAnalysisProfile !== "prestacao_servicos_gerais"
      ? itemAnalysisProfile
      : processAnalysisProfile;

  return {
    ...dfdContext,
    analysisProfile,
    estimate,
    itemDescription,
    itemQuantity: firstText(getExtractedValue(process, "item.quantity")),
    itemUnit: firstText(getExtractedValue(process, "item.unit")),
    processJustification,
  };
}

function inferContractingAnalysisProfile(contextText: string) {
  const normalizedText = normalizeSearchText(contextText);

  if (
    /\b(tecnologia|software|sistema|sistemas|suporte de software|ti|tic|informatica|implantacao|integracao|manutencao de sistema)\b/.test(
      normalizedText,
    )
  ) {
    return "tecnologia_software";
  }

  if (
    /\b(consultoria|assessoria|apoio tecnico|suporte tecnico administrativo|recursos humanos|orientacao tecnica|servico consultivo)\b/.test(
      normalizedText,
    )
  ) {
    return "consultoria_assessoria";
  }

  if (
    /\b(obra|engenharia|construcao|reforma|servico de engenharia|projeto executivo)\b/.test(
      normalizedText,
    )
  ) {
    return "obra_engenharia";
  }

  if (/\b(locacao|aluguel|equipamento|equipamentos)\b/.test(normalizedText)) {
    return "locacao_equipamentos";
  }

  if (
    /\b(fornecimento|aquisicao|compra|material|materiais|produto|produtos|bem|bens)\b/.test(
      normalizedText,
    )
  ) {
    return "fornecimento_bens";
  }

  if (
    /\b(apresentacao artistica|atracao artistica|show|banda|artista|musical|carnaval|festa popular)\b/.test(
      normalizedText,
    )
  ) {
    return "apresentacao_artistica";
  }

  if (/\b(evento|eventos|organizacao de evento|festividade|programacao)\b/.test(normalizedText)) {
    return "eventos_gerais";
  }

  if (
    /\b(servico continuado|servicos continuados|continuado|continuada|rotina|rotinas)\b/.test(
      normalizedText,
    )
  ) {
    return "prestacao_servicos_gerais";
  }

  return "prestacao_servicos_gerais";
}

export function buildTrGenerationContext({
  departments,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const etpContext = buildEtpGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const contractingType = inferContractingAnalysisProfile(
    [
      etpContext.object,
      etpContext.hasSourceItems ? etpContext.sourceItemsEvidenceText : etpContext.itemDescription,
      etpContext.processJustification,
      etpContext.processType,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  );

  return {
    ...etpContext,
    contractingType,
  };
}

export function buildMinutaGenerationContext({
  departments,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const trContext = buildTrGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });

  return {
    ...trContext,
    budgetAllocation: firstText(
      getExtractedValue(process, "budgetAllocation"),
      getExtractedValue(process, "budget.allocation"),
      getExtractedValue(process, "dotacao"),
      getExtractedValue(process, "dotacaoOrcamentaria"),
    ),
    contractNumber: firstText(
      getExtractedValue(process, "contractNumber"),
      getExtractedValue(process, "contract.number"),
    ),
    contractorAddress: firstText(
      getExtractedValue(process, "contractor.address"),
      getExtractedValue(process, "supplier.address"),
      getExtractedValue(process, "companyAddress"),
    ),
    contractorCnpj: firstText(
      getExtractedValue(process, "contractor.cnpj"),
      getExtractedValue(process, "supplier.cnpj"),
      getExtractedValue(process, "companyCnpj"),
      getExtractedValue(process, "contractedCnpj"),
    ),
    contractorName: firstText(
      getExtractedValue(process, "contractor.name"),
      getExtractedValue(process, "supplier.name"),
      getExtractedValue(process, "companyName"),
      getExtractedValue(process, "contractedName"),
    ),
    contractorRepresentative: firstText(
      getExtractedValue(process, "contractor.representative"),
      getExtractedValue(process, "supplier.representative"),
      getExtractedValue(process, "legalRepresentative"),
    ),
    contractorRepresentativeCpf: firstText(
      getExtractedValue(process, "contractor.representativeCpf"),
      getExtractedValue(process, "supplier.representativeCpf"),
      getExtractedValue(process, "legalRepresentativeCpf"),
    ),
    price: normalizeMinutaPrice(trContext.estimate.rawValue),
    procedureNumber: firstText(
      getExtractedValue(process, "procedureNumber"),
      getExtractedValue(process, "inexigibilidadeNumber"),
      getExtractedValue(process, "biddingNumber"),
      getExtractedValue(process, "directContractingNumber"),
    ),
  };
}

function buildDfdGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const recipe = resolveDocumentGenerationRecipe("dfd");

  if (!recipe) {
    throw new Error("DFD recipe is not configured.");
  }

  const context = buildDfdGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canônico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: DFD",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Número interno do processo: ${process.processNumber}`,
    `- Número da solicitação: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissão (pt-BR): ${context.issueDateBr}`,
    `- Data de emissão por extenso: ${context.issueDateLongBr}`,
    `- Objeto da solicitação: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Responsável pela solicitação: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsável: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orçamentária principal: ${toDisplayText(budgetUnit)}`,
    `- Nome canônico da unidade/departamento: ${toDisplayText(context.canonicalBudgetUnitName)}`,
    `- Nome da unidade extraído da origem: ${toDisplayText(context.sourceBudgetUnitName)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organização: ${toDisplayText(context.organizationName)}`,
    `- Organização extraída da origem: ${toDisplayText(context.sourceOrganizationName)}`,
    `- CNPJ da organização: ${toDisplayText(context.organizationCnpj)}`,
    `- Município/UF: ${organization.city}/${organization.state}`,
    ...sourceItemPromptLines(context, "origem"),
    `- Valor total/estimado extraído da origem: ${toDisplayText(context.estimate.rawValue)}`,
    `- Estimativa disponível: ${context.estimate.available ? "sim" : "não"}`,
    `- Valor a usar como referência no DFD: ${context.estimate.displayValue}`,
    `- Orientação sobre valor: ${context.estimate.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Rótulo/arquivo da origem: ${toDisplayText(context.sourceLabel)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Instruções adicionais do operador",
    instructions ?? "Nenhuma instrução adicional informada.",
    "",
    "## Regras finais obrigatórias",
    "- Retorne somente o DFD final em Markdown.",
    "- Siga a estrutura do modelo canônico.",
    "- Trate o DFD como documento inicial de formalização da demanda: objetivo, administrativo, introdutório, proporcional e revisável.",
    "- Mantenha contexto, objeto e justificativa em 1 ou 2 parágrafos cada, salvo complexidade real presente no contexto.",
    "- Use requisitos essenciais mínimos em 3 a 6 bullets curtos e diretamente ligados ao objeto.",
    "- Não inclua seções, títulos ou conteúdo de ETP, ESTUDO TÉCNICO PRELIMINAR, TR ou TERMO DE REFERÊNCIA.",
    "- Não desenvolva estudo de mercado, metodologia de pesquisa de preços, análise de alternativas, estudo de viabilidade, matriz de riscos ou riscos sofisticados.",
    "- Não inclua obrigações contratuais detalhadas, fiscalização contratual, critérios de pagamento, critérios de medição, aceite, SLA, sanções ou cláusulas de execução.",
    "- Se algum dado estiver ausente, explicite a ausência sem inventar fatos.",
    "- Não use crases ou código inline para valores dos campos do DFD.",
    "- Não declare compatibilidade com mercado, fundamento legal, duração, quantidade, local, exclusividade, reconhecimento artístico, dotação orçamentária ou atributos de fornecedor sem suporte no contexto.",
    "- Não declare economicidade comprovada, vantajosidade, validação de pesquisa de mercado ou legalidade conclusiva.",
    "- Se valor, execução, orçamento, mercado ou fornecedor estiverem ausentes, use redação simples de pendência de apuração, confirmação ou definição posterior.",
  ].join("\n");
}

function extractFixedClauseBlocks(template: string) {
  const pattern =
    /<!--\s*FIXED_CLAUSE_START:\s*([^>]+?)\s*-->\s*([\s\S]*?)\s*<!--\s*FIXED_CLAUSE_END\s*-->/g;
  const blocks: Array<{ title: string; markdown: string }> = [];

  for (const match of template.matchAll(pattern)) {
    blocks.push({
      title: normalizeText(match[1] ?? ""),
      markdown: normalizeText(match[2] ?? ""),
    });
  }

  return blocks;
}

function removeFixedClauseMarkerComments(text: string) {
  return text
    .replace(/<!--\s*FIXED_CLAUSE_START:[\s\S]*?-->\n?/g, "")
    .replace(/<!--\s*FIXED_CLAUSE_END\s*-->\n?/g, "")
    .trim();
}

function getMarkdownHeading(block: string) {
  const heading = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));

  return heading ? heading.replace(/^#{1,6}\s+/, "").trim() : null;
}

function normalizeHeadingForComparison(value: string) {
  return normalizeSearchText(value.replace(/^#{1,6}\s+/, "")).replace(/[^a-z0-9 ]/g, "");
}

function isClauseHeadingLine(value: string) {
  return /^clausula\b/.test(normalizeHeadingForComparison(value));
}

function enforceMinutaFixedClauses(text: string) {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  if (!recipe) {
    return text;
  }

  const fixedClauses = extractFixedClauseBlocks(recipe.template);
  let lines = removeFixedClauseMarkerComments(text).split(/\r?\n/);

  for (const clause of fixedClauses) {
    const canonicalBlock = removeFixedClauseMarkerComments(clause.markdown);
    const heading = getMarkdownHeading(canonicalBlock) ?? clause.title;
    const normalizedHeading = normalizeHeadingForComparison(heading);
    const startIndex = lines.findIndex((line) => {
      const normalizedLine = normalizeHeadingForComparison(line);

      return normalizedLine === normalizedHeading || normalizedLine.includes(normalizedHeading);
    });

    if (startIndex === -1) {
      lines = [...lines, "", canonicalBlock];
      continue;
    }

    const nextClauseRelativeIndex = lines
      .slice(startIndex + 1)
      .findIndex((line) => isClauseHeadingLine(line));
    const endIndex =
      nextClauseRelativeIndex === -1 ? lines.length : startIndex + 1 + nextClauseRelativeIndex;

    lines.splice(startIndex, endIndex - startIndex, ...canonicalBlock.split(/\r?\n/));
  }

  return lines.join("\n").trim();
}

function buildEtpGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const recipe = resolveDocumentGenerationRecipe("etp");

  if (!recipe) {
    throw new Error("ETP recipe is not configured.");
  }

  const context = buildEtpGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canônico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: ETP",
    `- Perfil de análise inferido para o ETP: ${context.analysisProfile}`,
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Número interno do processo: ${process.processNumber}`,
    `- Número da solicitação: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissão (pt-BR): ${context.issueDateBr}`,
    `- Data de emissão por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratação: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Responsável: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsável: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orçamentária principal: ${toDisplayText(budgetUnit)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organização: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da organização: ${toDisplayText(context.organizationCnpj)}`,
    `- Município/UF: ${organization.city}/${organization.state}`,
    ...sourceItemPromptLines(context, "SD"),
    `- Estimativa disponível: ${context.estimate.available ? "sim" : "não"}`,
    `- Valor bruto extraído da origem: ${context.estimate.rawValue ?? "não informado"}`,
    `- Valor a usar na seção de estimativa: ${context.estimate.displayValue}`,
    `- Orientação para estimativa: ${context.estimate.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Instruções adicionais do operador",
    instructions ?? "Nenhuma instrução adicional informada.",
    "",
    "## Regras finais obrigatórias",
    "- Retorne somente o ETP final em Markdown.",
    "- Siga a estrutura do modelo canônico, mantendo a seção ESTIMATIVA DO VALOR DA CONTRATAÇÃO.",
    "- Não inclua seções, títulos ou conteúdo de DFD, DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA, TR ou TERMO DE REFERÊNCIA.",
    "- Você pode reutilizar ou adaptar contexto de DFD/SD apenas como conteúdo narrativo, sem copiar headings de DFD.",
    "- Use o perfil de análise inferido apenas para ajustar a ênfase técnica do ETP; ele não autoriza criar fatos ausentes no contexto.",
    "- Preserve a consistência entre objeto, município, organização, unidade administrativa, item da SD, estimativa disponível e perfil de análise inferido.",
    "- Não cite artista, fornecedor, órgão, município, objeto, tipo de documento de origem ou categoria de contratação diferente do contexto estruturado.",
    "- Não misture informações de DFD, TR, minuta, exemplos anteriores, documentos de referência ou outra geração quando essas informações não estiverem no contexto.",
    "- Se a estimativa estiver indisponível, desenvolva metodologia de apuração posterior com linguagem institucional, evitando repetir mecanicamente não informado ou não consta no contexto.",
    "- Não invente valores, não simule pesquisa de mercado e não declare consultas realizadas sem fonte no contexto.",
    "- Use referências à Lei nº 14.133/2021 e a boas práticas do TCU apenas como orientação geral de planejamento; não invente artigo, acórdão ou conclusão jurídica específica.",
  ].join("\n");
}

function buildTrGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const recipe = resolveDocumentGenerationRecipe("tr");

  if (!recipe) {
    throw new Error("TR recipe is not configured.");
  }

  const context = buildTrGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canônico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: TR",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Tipo de contratação inferido para obrigações: ${context.contractingType}`,
    `- Número interno do processo: ${process.processNumber}`,
    `- Número da solicitação: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissão (pt-BR): ${context.issueDateBr}`,
    `- Data de emissão por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratação: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Responsável: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsável: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orçamentária principal: ${toDisplayText(budgetUnit)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organização: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da organização: ${toDisplayText(context.organizationCnpj)}`,
    `- Município/UF: ${organization.city}/${organization.state}`,
    ...sourceItemPromptLines(context, "SD"),
    `- Estimativa disponível: ${context.estimate.available ? "sim" : "não"}`,
    `- Valor bruto extraído da origem: ${context.estimate.rawValue ?? "não informado"}`,
    `- Valor a usar na seção de valor estimado: ${context.estimate.displayValue}`,
    `- Orientação para valor estimado: ${context.estimate.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Orientação para obrigações",
    `- Use prioritariamente o bloco Tipo: ${context.contractingType} da seção Obrigações por tipo de contratação.`,
    "- Adapte as obrigações ao objeto e ao contexto específico em linguagem operacional, executável e fiscalizável.",
    "- Não copie obrigações incompatíveis com o objeto.",
    "- Não misture blocos de tipos diferentes sem necessidade demonstrada no contexto.",
    "",
    "## Instruções adicionais do operador",
    instructions ?? "Nenhuma instrução adicional informada.",
    "",
    "## Regras finais obrigatórias",
    "- Retorne somente o TR final em Markdown.",
    "- Siga a estrutura do modelo canônico, mantendo a seção VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA.",
    "- Trate o TR como documento técnico-operacional: ele deve explicar como o objeto será executado, acompanhado, fiscalizado, recebido e entregue.",
    "- Operacionalize sem inventar: estruture execução, responsabilidades, fluxos, alinhamentos, condicionantes e fiscalização somente a partir do contexto disponível.",
    "- Faça a seção ESPECIFICAÇÕES TÉCNICAS DO SERVIÇO funcionar como principal seção operacional do TR, com dinâmica de execução, requisitos, interfaces, responsabilidades, condições de entrega e alinhamentos necessários.",
    "- Obrigações da contratada e da contratante devem ser práticas, executáveis, fiscalizáveis e proporcionais ao objeto.",
    "- Não inclua seções, títulos ou conteúdo de DFD, DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA, ETP ou ESTUDO TÉCNICO PRELIMINAR.",
    "- Não inclua headings como DADOS DA SOLICITAÇÃO, LEVANTAMENTO DE MERCADO ou ANÁLISE DE ALTERNATIVAS.",
    "- Não transforme o TR em ETP, parecer jurídico, minuta contratual ou checklist genérico.",
    "- Você pode reutilizar ou adaptar contexto de DFD/ETP/SD apenas como conteúdo operacional, sem copiar headings desses documentos.",
    "- Se a estimativa estiver indisponível, indique que o valor será apurado em etapa própria, sem afirmar pesquisa realizada, economicidade, vantajosidade ou compatibilidade de mercado.",
    "- Se detalhes operacionais estiverem ausentes, descreva que deverão ser alinhados, confirmados ou consolidados antes da execução ou no instrumento subsequente.",
    "- Não invente valores, dados técnicos, rider técnico, datas, locais, durações, infraestrutura, cronogramas, quantidades, equipes, condições de pagamento, SLA, sanções específicas, percentuais, fornecedor, credenciais, dotação, fundamento legal ou pesquisa de preços.",
  ].join("\n");
}

function buildMinutaGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  if (!recipe) {
    throw new Error("Minuta recipe is not configured.");
  }

  const context = buildMinutaGenerationContext({
    departments,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");
  const fixedClauseTitles = extractFixedClauseBlocks(recipe.template)
    .map((clause) => clause.title)
    .join("; ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canônico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: MINUTA",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Tipo de contratação inferido para obrigações: ${context.contractingType}`,
    `- Número interno do processo: ${process.processNumber}`,
    `- Número da minuta/contrato: ${context.contractNumber ?? "XXX/2026"}`,
    `- Número do procedimento: ${context.procedureNumber ?? "XXX/2026"}`,
    `- Número da solicitação: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissão (pt-BR): ${context.issueDateBr}`,
    `- Data de emissão por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratação: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Unidade orçamentária principal: ${toDisplayText(budgetUnit)}`,
    `- Dotação orçamentária: ${context.budgetAllocation ?? "{{budget.allocation_or_placeholder}}"}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organização contratante: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da contratante: ${toDisplayText(context.organizationCnpj)}`,
    `- Endereço da contratante: ${organization.address ?? "{{organization.address_or_placeholder}}"}`,
    `- Município/UF: ${organization.city}/${organization.state}`,
    `- Autoridade da contratante: ${organization.authorityName ?? "{{organization.authorityName_or_placeholder}}"}`,
    `- Cargo da autoridade: ${organization.authorityRole ?? "{{organization.authorityRole_or_placeholder}}"}`,
    `- Contratada: ${context.contractorName ?? "[CONTRATADA]"}`,
    `- CPF/CNPJ da contratada: ${context.contractorCnpj ?? "[CNPJ DA CONTRATADA]"}`,
    `- Endereço da contratada: ${context.contractorAddress ?? "[ENDEREÇO DA CONTRATADA]"}`,
    `- Representante legal da contratada: ${context.contractorRepresentative ?? "[REPRESENTANTE LEGAL]"}`,
    `- CPF do representante legal: ${context.contractorRepresentativeCpf ?? "[CPF DO REPRESENTANTE]"}`,
    ...sourceItemPromptLines(context, "SD"),
    `- Preço disponível: ${context.price.available ? "sim" : "não"}`,
    `- Valor bruto extraído da origem: ${context.price.rawValue ?? "não informado"}`,
    `- Valor a usar na cláusula DO PREÇO: ${context.price.displayValue}`,
    `- Orientação para preço: ${context.price.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Orientação para obrigações",
    "- Derive obrigações prioritariamente de TR quando houver conteúdo disponível no contexto.",
    `- Use prioritariamente o bloco Tipo: ${context.contractingType} da seção Obrigações por tipo de contratação quando não houver TR suficiente.`,
    "- Adapte as obrigações ao objeto e ao contexto específico, sempre em linguagem contratual.",
    "- Não copie obrigações incompatíveis com o objeto.",
    "- Não misture blocos de tipos diferentes sem necessidade demonstrada no contexto.",
    "",
    "## Regras para cláusulas FIXED",
    `- Cláusulas FIXED do template: ${fixedClauseTitles}.`,
    "- Copie as cláusulas FIXED exatamente como estão no template.",
    "- A única alteração permitida nas cláusulas FIXED é substituir placeholders por dados válidos presentes no contexto.",
    "- Não reescreva, resuma, simplifique, reorganize nem altere termos jurídicos das cláusulas FIXED.",
    "",
    "## Instruções adicionais do operador",
    instructions ?? "Nenhuma instrução adicional informada.",
    "",
    "## Regras finais obrigatórias",
    "- Retorne somente a MINUTA DE CONTRATO final em Markdown.",
    "- Siga a estrutura do modelo canônico, mantendo todas as cláusulas contratuais.",
    "- Trate a Minuta como o instrumento que formaliza contratualmente a operação descrita pelo TR e pelos documentos do processo.",
    "- Converta contexto operacional em linguagem contratual: obrigações, condições de execução, fiscalização, recebimento, pagamento e consequências administrativas.",
    "- Preserve a arquitetura de cláusulas FIXED, cláusulas semi-fixas, blocos condicionais e trechos contextuais.",
    "- Enriqueça as cláusulas semi-fixas de objeto, execução, pagamento, vigência, dotação, obrigações, fiscalização, recebimento, penalidades e extinção com contextualização contratual conservadora.",
    "- Use os módulos condicionais do tipo de contratação inferido para dar textura contratual ao objeto, sem copiar exemplos incompatíveis.",
    "- Mantenha obrigatoriamente a cláusula DO PREÇO.",
    "- Se o preço estiver indisponível ou informado como zero, use o placeholder R$ XX.XXX,XX.",
    "- Não inclua seções, títulos ou conteúdo de DFD, DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA, ETP, ESTUDO TÉCNICO PRELIMINAR, TR ou TERMO DE REFERÊNCIA.",
    "- Você pode reutilizar ou adaptar contexto de TR/ETP/SD apenas como conteúdo contratual, sem copiar headings desses documentos.",
    "- Não transforme a Minuta em TR, ETP, parecer jurídico, checklist ou contrato hiper detalhado.",
    "- Não invente valores, nomes, CPF, CNPJ, endereços, datas, locais, prazos, dotações ou dados de execução.",
    "- Não invente multas, percentuais, SLA, cronogramas, quantitativos, rider técnico, garantias, fundamento jurídico específico, documentos, regime, credenciais de fornecedor, pagamento, medições ou obrigações sem suporte contextual.",
    "- Quando dados estiverem ausentes, preserve placeholders ou use redação contratual condicional, evitando repetição excessiva de não informado, quando aplicável ou a definir.",
  ].join("\n");
}

export function buildDocumentGenerationPrompt({
  departments = [],
  documentType,
  instructions,
  organization,
  process,
  processItems = [],
  responsibleUserName = null,
}: {
  departments?: StoredDepartment[];
  documentType: GeneratedDocumentType;
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
} & ProcessGenerationExtras) {
  if (documentType === "dfd") {
    return buildDfdGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
      processItems,
      responsibleUserName,
    });
  }

  if (documentType === "etp") {
    return buildEtpGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
      processItems,
      responsibleUserName,
    });
  }

  if (documentType === "tr") {
    return buildTrGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
      processItems,
      responsibleUserName,
    });
  }

  if (documentType === "minuta") {
    return buildMinutaGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
      processItems,
      responsibleUserName,
    });
  }

  return buildGenericDocumentGenerationPrompt({
    documentType,
    instructions,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
}

export function sanitizeGeneratedDocumentDraft({
  documentType,
  text,
}: {
  documentType: GeneratedDocumentType;
  text: string;
}) {
  const trimmed = text.trim();

  if (
    documentType !== "dfd" &&
    documentType !== "etp" &&
    documentType !== "tr" &&
    documentType !== "minuta"
  ) {
    return trimmed;
  }

  const lines = trimmed.split(/\r?\n/);
  const startIndex =
    documentType === "etp" || documentType === "tr" || documentType === "minuta"
      ? lines.findIndex((line) => {
          const normalizedLine = normalizeSearchText(line);

          if (documentType === "tr") {
            return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(termo de referencia|tr)\b/.test(normalizedLine);
          }

          if (documentType === "minuta") {
            return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(minuta do contrato|termo de contrato|contrato|clausula primeira\b)/.test(
              normalizedLine,
            );
          }

          return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(estudo tecnico preliminar|etp)\b/.test(
            normalizedLine,
          );
        })
      : 0;
  const candidateLines = startIndex > 0 ? lines.slice(startIndex) : lines;
  const stopIndex = candidateLines.findIndex((line) => {
    const normalizedLine = normalizeSearchText(line);

    if (documentType === "dfd") {
      return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(estudo tecnico preliminar|etp|termo de referencia|tr)\b/.test(
        normalizedLine,
      );
    }

    if (documentType === "tr") {
      return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(documento de formalizacao de demanda|dfd|estudo tecnico preliminar|etp|dados da solicitacao|levantamento de mercado|analise de alternativas)\b/.test(
        normalizedLine,
      );
    }

    if (documentType === "minuta") {
      return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(documento de formalizacao de demanda|dfd|estudo tecnico preliminar|etp|termo de referencia|tr|dados da solicitacao|levantamento de mercado|analise de alternativas|especificacoes tecnicas do servico)\b/.test(
        normalizedLine,
      );
    }

    return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(documento de formalizacao de demanda|dfd|termo de referencia|tr)\b/.test(
      normalizedLine,
    );
  });
  let sanitized = (stopIndex === -1 ? candidateLines : candidateLines.slice(0, stopIndex))
    .join("\n")
    .trim();

  if (documentType === "etp") {
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "não informado");

    if (!/estimativa do valor da contratacao/i.test(normalizeSearchText(sanitized))) {
      sanitized = [
        sanitized,
        "",
        "## 5. ESTIMATIVA DO VALOR DA CONTRATAÇÃO",
        "",
        "O valor estimado dependerá de apuração complementar em etapa própria, com pesquisa de preços compatível com o objeto e registro dos critérios adotados.",
      ]
        .join("\n")
        .trim();
    }
  }

  if (documentType === "tr") {
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "não informado");

    if (!/valor estimado e dotacao orcamentaria/i.test(normalizeSearchText(sanitized))) {
      sanitized = [
        sanitized,
        "",
        "## 7. VALOR ESTIMADO E DOTAÇÃO ORÇAMENTÁRIA",
        "",
        "Valor não informado no contexto; a estimativa será apurada posteriormente por pesquisa de mercado ou etapa própria.",
      ]
        .join("\n")
        .trim();
    }
  }

  if (documentType === "minuta") {
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "R$ XX.XXX,XX");
    sanitized = removeFixedClauseMarkerComments(sanitized);

    if (!/clausula segunda\s+-\s+do preco/i.test(normalizeSearchText(sanitized))) {
      sanitized = [
        sanitized,
        "",
        "## CLÁUSULA SEGUNDA - DO PREÇO",
        "",
        "2.1. O valor do presente contrato é de `R$ XX.XXX,XX`.",
        "",
        "2.2. O preço não consta no contexto ou foi informado como zero; por isso, deverá ser preenchido em etapa própria, sem simulação de valores.",
      ]
        .join("\n")
        .trim();
    }

    sanitized = enforceMinutaFixedClauses(sanitized);
  }

  return sanitized;
}
