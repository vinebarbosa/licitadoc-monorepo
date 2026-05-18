import { eq, type SQL } from "drizzle-orm";
import type { Actor } from "../../authorization/actor";
import type { departments, organizations, processes } from "../../db";
import { documents } from "../../db";
import type { GeneratedDocumentType } from "../../shared/text-generation/types";
import { documentTextToTiptapJson, isTiptapDocumentJson } from "../../shared/tiptap-json";
import { serializeOrganizationLetterhead } from "../organizations/organizations.shared";
import type { SerializedProcessItem } from "../processes/processes.shared";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";

export type StoredDocument = typeof documents.$inferSelect;
export type StoredDepartment = typeof departments.$inferSelect;
export type StoredOrganization = typeof organizations.$inferSelect;
export type StoredProcess = typeof processes.$inferSelect;
export type SourceItemComponentForGeneration = {
  title: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
};
export type SourceItemForGeneration = {
  origin: "canonical" | "source";
  kind: "simple" | "kit" | "source";
  code: string | null;
  title: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
  components: SourceItemComponentForGeneration[];
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

export function serializeDocumentDetail(
  document: StoredDocument,
  organization?: StoredOrganization | null,
) {
  const draftContentJson = isTiptapDocumentJson(document.draftContentJson)
    ? document.draftContentJson
    : document.draftContent?.trim()
      ? documentTextToTiptapJson(document.draftContent)
      : null;

  return {
    ...serializeDocumentSummary(document),
    draftContent: document.draftContent ?? null,
    draftContentJson,
    letterhead: serializeOrganizationLetterhead(organization ?? null),
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

function getCanonicalProcessItems(
  processItems: SerializedProcessItem[] = [],
): SourceItemForGeneration[] {
  return processItems.map((item) => {
    const components =
      item.kind === "kit"
        ? item.components.map((component) => ({
            description: component.description,
            quantity: component.quantity,
            title: component.title,
            unit: component.unit,
          }))
        : [];

    return {
      code: item.code,
      components,
      description: item.description,
      kind: item.kind,
      origin: "canonical",
      quantity: item.quantity,
      title: item.title,
      totalValue: item.totalValue,
      unit: item.unit,
      unitValue: item.unitValue,
    };
  });
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
        components: [],
        description: firstText(
          getNullableScalarText(item.description),
          getNullableScalarText(item.itemDescription),
          getNullableScalarText(item.descricao),
        ),
        kind: "source" as const,
        origin: "source" as const,
        quantity: firstText(
          getNullableScalarText(item.quantity),
          getNullableScalarText(item.quantidade),
        ),
        title: null,
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
      const hasMeaningfulValue = [
        normalized.code,
        normalized.description,
        normalized.quantity,
        normalized.title,
        normalized.totalValue,
        normalized.unit,
        normalized.unitValue,
      ].some((value) => value !== null);

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

function formatCurrencyBr(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

function getCanonicalItemsEstimatedTotal(items: SourceItemForGeneration[]) {
  let estimatedTotal = 0;
  let hasTotal = false;

  for (const item of items) {
    if (item.origin !== "canonical" || !item.totalValue) {
      continue;
    }

    const amount = normalizeMonetaryNumber(item.totalValue);

    if (amount !== null) {
      estimatedTotal += amount;
      hasTotal = true;
    }
  }

  return hasTotal ? formatCurrencyBr(estimatedTotal) : null;
}

function formatSourceItemComponentLine(component: SourceItemComponentForGeneration, index: number) {
  const identity = [component.title, compactSourceItemDescription(component.description)]
    .filter((value): value is string => Boolean(value))
    .join(" - ");
  const quantity = [component.quantity, component.unit]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return `    - Componente ${index + 1}: ${identity || "componente sem descrição"}${
    quantity ? ` | qtd. ${quantity}` : ""
  }`;
}

function formatSourceItemMoney(item: SourceItemForGeneration, value: string) {
  if (item.origin !== "canonical") {
    return value;
  }

  const amount = normalizeMonetaryNumber(value);

  return amount === null ? value : formatCurrencyBr(amount);
}

function formatSourceItemLine(item: SourceItemForGeneration, index: number) {
  const compactDescription = compactSourceItemDescription(item.description);
  const identity = [
    item.code,
    compactSourceItemDescription(firstText(item.title, item.description)),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" - ");
  const details = [
    item.title && compactDescription && item.title !== compactDescription
      ? `descrição ${compactDescription}`
      : null,
    [item.quantity, item.unit].filter((value): value is string => Boolean(value)).join(" ")
      ? `qtd. ${[item.quantity, item.unit].filter((value): value is string => Boolean(value)).join(" ")}`
      : null,
    item.unitValue ? `unitário ${formatSourceItemMoney(item, item.unitValue)}` : null,
    item.totalValue ? `total ${formatSourceItemMoney(item, item.totalValue)}` : null,
  ].filter((value): value is string => Boolean(value));

  const itemLine = `  ${index + 1}. ${identity || "item sem descrição"}${
    details.length > 0 ? ` | ${details.join(" | ")}` : ""
  }`;

  if (item.kind !== "kit" || item.components.length === 0) {
    return itemLine;
  }

  return [itemLine, ...item.components.map(formatSourceItemComponentLine)].join("\n");
}

function formatSourceItemsSummary(items: SourceItemForGeneration[]) {
  if (items.length === 0) {
    return null;
  }

  const usesCanonicalItems = items.some((item) => item.origin === "canonical");
  const countLabel = usesCanonicalItems ? "Itens do processo" : "Itens da SD revisados";
  const listLabel = usesCanonicalItems ? "Lista de itens do processo" : "Lista de itens da SD";

  return [
    `- ${countLabel}: ${items.length}`,
    `- ${listLabel}:`,
    ...items.map(formatSourceItemLine),
  ].join("\n");
}

function getSourceItemsEvidenceText(items: SourceItemForGeneration[]) {
  return items
    .flatMap((item) => [
      item.code,
      item.title,
      item.description,
      ...item.components.flatMap((component) => [component.title, component.description]),
    ])
    .filter((value): value is string => Boolean(value))
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
      guidance: "Estimativa pendente de apuração em etapa própria.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "não informado",
      guidance: "Estimativa pendente de apuração em etapa própria.",
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
      guidance: "Preço pendente; manter placeholder contratual.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "R$ XX.XXX,XX",
      guidance: "Preço pendente; manter placeholder contratual.",
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

function getMinutaDocumentFacingPlaceholder(token: string) {
  const normalizedToken = normalizeSearchText(token);

  if (/price|preco|valor/.test(normalizedToken)) {
    return "R$ XX.XXX,XX";
  }

  if (/date|data|issuedat|startdate|enddate|signaturedate/.test(normalizedToken)) {
    return "XX/XX/XXXX";
  }

  if (/contract\.number|procedure|process\.processnumber|number/.test(normalizedToken)) {
    return "XXX/2026";
  }

  if (/state|uf/.test(normalizedToken)) {
    return "XX";
  }

  return "XXX";
}

function replaceMinutaTemplatePlaceholders(text: string) {
  return text.replace(/\{\{\s*([^}]+?)\s*}}/g, (_match, token: string) =>
    getMinutaDocumentFacingPlaceholder(token),
  );
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
  const canonicalItemsEstimate = getCanonicalItemsEstimatedTotal(sourceItems);
  const rawEstimate = firstText(
    canonicalItemsEstimate,
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

  return {
    ...dfdContext,
    estimate,
    itemDescription,
    itemQuantity: firstText(getExtractedValue(process, "item.quantity")),
    itemUnit: firstText(getExtractedValue(process, "item.unit")),
    processJustification,
  };
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

  return {
    ...etpContext,
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
    `- Valor total/estimado de referência: ${toDisplayText(context.estimate.rawValue)}`,
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
    "- Não inclua heading de FECHO, ASSINATURA ou equivalente; mantenha o bloco final sem título, com local/data, nome e cargo em linhas Markdown simples.",
    "- Evite estudo de mercado, metodologia de pesquisa de preços, análise de alternativas, estudo de viabilidade, matriz de riscos ou riscos sofisticados.",
    "- Evite obrigações contratuais detalhadas, fiscalização contratual, critérios de pagamento, medição, aceite, SLA, sanções ou cláusulas de execução.",
    "- Não use crases ou código inline para valores dos campos do DFD.",
    "- Mantenha a inteligência administrativa invisível no texto final.",
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

const MINUTA_FIXED_CLAUSE_TOPICS = [
  {
    aliases: [
      "DAS PRERROGATIVAS",
      "DAS PRERROGATIVAS DA ADMINISTRAÇÃO",
      "DOS DIREITOS DA CONTRATANTE",
      "DOS DIREITOS DA ADMINISTRAÇÃO",
    ],
    canonicalHeading: "CLÁUSULA DÉCIMA TERCEIRA - DAS PRERROGATIVAS",
    label: "DAS PRERROGATIVAS",
    topic: "prerogatives",
  },
  {
    aliases: [
      "DA ALTERAÇÃO E REAJUSTE",
      "DAS ALTERAÇÕES",
      "DA ALTERAÇÃO",
      "DO REAJUSTE",
      "DAS ALTERAÇÕES E REAJUSTES",
      "DA ALTERAÇÃO, REAJUSTE E REPACTUAÇÃO",
    ],
    canonicalHeading: "CLÁUSULA DÉCIMA QUARTA - DA ALTERAÇÃO E REAJUSTE",
    label: "DA ALTERAÇÃO E REAJUSTE",
    topic: "alteration_adjustment",
  },
  {
    aliases: [
      "DAS CONDIÇÕES DE HABILITAÇÃO",
      "DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO",
      "DA MANUTENÇÃO DAS CONDIÇÕES DE HABILITAÇÃO E QUALIFICAÇÃO",
      "DAS CONDIÇÕES DE HABILITAÇÃO E QUALIFICAÇÃO",
    ],
    canonicalHeading: "CLÁUSULA DÉCIMA QUINTA - DAS CONDIÇÕES DE HABILITAÇÃO",
    label: "DAS CONDIÇÕES DE HABILITAÇÃO",
    topic: "habilitation_conditions",
  },
  {
    aliases: ["DA PUBLICIDADE", "DA PUBLICAÇÃO", "DA PUBLICAÇÃO E PUBLICIDADE"],
    canonicalHeading: "CLÁUSULA DÉCIMA SEXTA - DA PUBLICIDADE",
    label: "DA PUBLICIDADE",
    topic: "publicity",
  },
  {
    aliases: ["DOS CASOS OMISSOS"],
    canonicalHeading: "CLÁUSULA DÉCIMA SÉTIMA - DOS CASOS OMISSOS",
    label: "DOS CASOS OMISSOS",
    topic: "omitted_cases",
  },
  {
    aliases: ["DO FORO", "DO FORO COMPETENTE"],
    canonicalHeading: "CLÁUSULA DÉCIMA OITAVA - DO FORO",
    label: "DO FORO",
    topic: "forum",
  },
] as const;

type MinutaFixedClauseTopic = (typeof MINUTA_FIXED_CLAUSE_TOPICS)[number]["topic"];

type MinutaClauseBlock = {
  end: number;
  heading: string;
  start: number;
};

export type MinutaClauseStructureAnalysis = {
  aliasFixedClauseHeadings: Array<{
    canonicalHeading: string;
    heading: string;
    topic: MinutaFixedClauseTopic;
    topicLabel: string;
  }>;
  duplicateFixedTopics: Array<{
    headings: string[];
    topic: MinutaFixedClauseTopic;
    topicLabel: string;
  }>;
  hasClosingBeforeLaterClause: boolean;
};

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

function getMinutaFixedClauseTopicConfig(topic: MinutaFixedClauseTopic) {
  return MINUTA_FIXED_CLAUSE_TOPICS.find((entry) => entry.topic === topic) ?? null;
}

function getMinutaFixedClauseTopicFromHeading(value: string): MinutaFixedClauseTopic | null {
  if (!isClauseHeadingLine(value)) {
    return null;
  }

  const normalizedHeading = normalizeHeadingForComparison(value);

  for (const entry of MINUTA_FIXED_CLAUSE_TOPICS) {
    const aliases = [entry.canonicalHeading, ...entry.aliases];
    const matchesAlias = aliases.some((alias) =>
      normalizedHeading.includes(normalizeHeadingForComparison(alias)),
    );

    if (matchesAlias) {
      return entry.topic;
    }
  }

  return null;
}

function isCanonicalMinutaFixedClauseHeading(value: string, topic: MinutaFixedClauseTopic) {
  const config = getMinutaFixedClauseTopicConfig(topic);

  if (!config) {
    return false;
  }

  return (
    normalizeHeadingForComparison(value) === normalizeHeadingForComparison(config.canonicalHeading)
  );
}

function findMinutaClauseBlocks(lines: string[]): MinutaClauseBlock[] {
  const starts = lines
    .map((line, index) => ({ index, line }))
    .filter(({ line }) => isClauseHeadingLine(line));

  return starts.map((start, index) => ({
    end: starts[index + 1]?.index ?? lines.length,
    heading: start.line.trim(),
    start: start.index,
  }));
}

function isMinutaSignatureDateLine(value: string) {
  const trimmed = value.trim();

  return /^(?:\{\{[^}]+}}\s*\/\s*\{\{[^}]+}}|[A-Za-zÀ-ÿ .'-]+\/[A-Z]{2}),\s+/.test(trimmed);
}

function isMinutaClosingStartLine(value: string) {
  const normalized = normalizeSearchText(value);

  return (
    /^e,?\s+por\s+estarem\b/.test(normalized) ||
    /^por\s+estarem\b/.test(normalized) ||
    /^testemunhas:?$/.test(normalized) ||
    isSignatureSeparatorLine(value) ||
    isMinutaSignatureDateLine(value)
  );
}

function extractMinutaClosingBlocks(text: string) {
  const bodyLines: string[] = [];
  const closingBlocks: string[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; ) {
    if (!isMinutaClosingStartLine(lines[index] ?? "")) {
      bodyLines.push(lines[index] ?? "");
      index += 1;
      continue;
    }

    const blockLines: string[] = [];

    while (index < lines.length && !isClauseHeadingLine(lines[index] ?? "")) {
      blockLines.push(lines[index] ?? "");
      index += 1;
    }

    const block = blockLines.join("\n").trim();

    if (block) {
      closingBlocks.push(block);
    }
  }

  return {
    body: bodyLines.join("\n").trim(),
    closingBlock: closingBlocks.at(-1) ?? null,
  };
}

function hasMinutaClosingBeforeLaterClause(text: string) {
  const lines = removeFixedClauseMarkerComments(text).split(/\r?\n/);

  return lines.some(
    (line, index) =>
      isMinutaClosingStartLine(line) &&
      lines.slice(index + 1).some((candidate) => isClauseHeadingLine(candidate)),
  );
}

function appendMarkdownBlock(lines: string[], block: string) {
  const blockLines = block.trim().split(/\r?\n/);

  while (lines.length > 0 && !lines.at(-1)?.trim()) {
    lines.pop();
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(...blockLines);
}

function insertMinutaClauseAfterFirstClause(text: string, clauseBlock: string) {
  const lines = text.split(/\r?\n/);
  const firstClause = findMinutaClauseBlocks(lines).find((block) =>
    normalizeHeadingForComparison(block.heading).includes("clausula primeira"),
  );
  const insertIndex = firstClause?.end ?? lines.length;
  const outputLines = [...lines.slice(0, insertIndex)];

  appendMarkdownBlock(outputLines, clauseBlock);

  const remainingLines = lines.slice(insertIndex);

  if (remainingLines.some((line) => line.trim())) {
    outputLines.push("");
    outputLines.push(...remainingLines);
  }

  return outputLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function analyzeMinutaClauseStructure(text: string): MinutaClauseStructureAnalysis {
  const lines = removeFixedClauseMarkerComments(text).split(/\r?\n/);
  const headingsByTopic = new Map<MinutaFixedClauseTopic, string[]>();
  const aliasFixedClauseHeadings: MinutaClauseStructureAnalysis["aliasFixedClauseHeadings"] = [];

  for (const block of findMinutaClauseBlocks(lines)) {
    const topic = getMinutaFixedClauseTopicFromHeading(block.heading);

    if (!topic) {
      continue;
    }

    const config = getMinutaFixedClauseTopicConfig(topic);

    if (!config) {
      continue;
    }

    headingsByTopic.set(topic, [...(headingsByTopic.get(topic) ?? []), block.heading]);

    if (!isCanonicalMinutaFixedClauseHeading(block.heading, topic)) {
      aliasFixedClauseHeadings.push({
        canonicalHeading: config.canonicalHeading,
        heading: block.heading,
        topic,
        topicLabel: config.label,
      });
    }
  }

  return {
    aliasFixedClauseHeadings,
    duplicateFixedTopics: [...headingsByTopic.entries()]
      .filter(([, headings]) => headings.length > 1)
      .map(([topic, headings]) => ({
        headings,
        topic,
        topicLabel: getMinutaFixedClauseTopicConfig(topic)?.label ?? topic,
      })),
    hasClosingBeforeLaterClause: hasMinutaClosingBeforeLaterClause(text),
  };
}

function isAdministrativeClosingHeading(value: string) {
  return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(fecho|assinatura)\b/.test(normalizeSearchText(value));
}

function removeAdministrativeClosingHeadings(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => !isAdministrativeClosingHeading(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isSignatureSeparatorLine(value: string) {
  return /^[_-]{8,}$/.test(value.trim());
}

function removeSignatureSeparatorLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => !isSignatureSeparatorLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unwrapAlignmentHtmlLine(line: string) {
  const match = line.match(
    /^\s*<(div|p)\b(?=[^>]*(?:\balign\s*=\s*["']?(?:right|center)["']?|\bstyle\s*=\s*["'][^"']*\btext-align\s*:\s*(?:right|center)\b[^"']*["']))[^>]*>([\s\S]*?)<\/\1>\s*$/i,
  );

  return match ? (match[2] ?? "").trim() : null;
}

function normalizeGeneratedClosingAlignmentHtml(text: string) {
  const normalizedLines: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    const unwrappedLine = unwrapAlignmentHtmlLine(line);

    if (unwrappedLine === null) {
      normalizedLines.push(line);
      continue;
    }

    if (normalizedLines.length > 0 && normalizedLines.at(-1)?.trim()) {
      normalizedLines.push("");
    }

    normalizedLines.push(unwrappedLine);
    normalizedLines.push("");
  }

  return normalizedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceMinutaFixedClauses(text: string) {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  if (!recipe) {
    return text;
  }

  const fixedClauses = extractFixedClauseBlocks(recipe.template).map((clause) => {
    const canonicalBlock = removeFixedClauseMarkerComments(clause.markdown);
    const heading = getMarkdownHeading(canonicalBlock) ?? clause.title;

    return {
      canonicalBlock,
      topic: getMinutaFixedClauseTopicFromHeading(heading),
    };
  });
  const fixedTopics = new Set(
    fixedClauses
      .map((clause) => clause.topic)
      .filter((topic): topic is MinutaFixedClauseTopic => topic !== null),
  );
  const { body, closingBlock } = extractMinutaClosingBlocks(removeFixedClauseMarkerComments(text));
  const lines = body ? body.split(/\r?\n/) : [];
  const fixedRanges = findMinutaClauseBlocks(lines)
    .map((block) => ({
      ...block,
      topic: getMinutaFixedClauseTopicFromHeading(block.heading),
    }))
    .filter((block) => block.topic !== null && fixedTopics.has(block.topic))
    .sort((left, right) => left.start - right.start);
  const outputLines: string[] = [];
  let rangeIndex = 0;
  let fixedTailInserted = false;

  const appendFixedTail = () => {
    if (fixedTailInserted) {
      return;
    }

    for (const clause of fixedClauses) {
      appendMarkdownBlock(outputLines, clause.canonicalBlock);
    }

    fixedTailInserted = true;
  };

  for (let index = 0; index < lines.length; ) {
    const range = fixedRanges[rangeIndex];

    if (range && index === range.start) {
      appendFixedTail();
      index = range.end;
      rangeIndex += 1;
      continue;
    }

    outputLines.push(lines[index] ?? "");
    index += 1;
  }

  appendFixedTail();

  if (closingBlock) {
    appendMarkdownBlock(outputLines, closingBlock);
  }

  return outputLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
    `- Valor bruto de referência: ${context.estimate.rawValue ?? "não informado"}`,
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
    "- Não inclua heading de FECHO, ASSINATURA ou equivalente; mantenha o bloco final sem título, com local/data, nome e cargo em linhas Markdown simples.",
    "- Você pode reutilizar ou adaptar contexto de DFD/SD apenas como conteúdo narrativo, sem copiar headings de DFD.",
    "- Use o pacote de contexto enriquecido e o plano documental para ajustar a ênfase técnica do ETP; eles não autorizam criar fatos ausentes.",
    "- Preserve a consistência entre objeto, município, organização, unidade administrativa, itens da SD e estimativa disponível.",
    "- Desenvolva estimativa, riscos, alternativas e fiscalização com profundidade proporcional ao plano documental.",
    "- Evite repetir mecanicamente expressões de ausência de dados; use redação institucional natural.",
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
    `- Valor bruto de referência: ${context.estimate.rawValue ?? "não informado"}`,
    `- Valor a usar na seção de valor estimado: ${context.estimate.displayValue}`,
    `- Orientação para valor estimado: ${context.estimate.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
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
    "- Não inclua heading de FECHO, ASSINATURA ou equivalente; mantenha o bloco final sem título, com local/data, nome e cargo em linhas Markdown simples.",
    "- Não transforme o TR em ETP, parecer jurídico, minuta contratual ou checklist genérico.",
    "- Você pode reutilizar ou adaptar contexto de DFD/ETP/SD apenas como conteúdo operacional, sem copiar headings desses documentos.",
    "- Use redação operacional natural para lacunas: placeholder, providência objetiva ou frase curta.",
    "- Varie a densidade das seções, dando mais corpo ao que afeta execução, recebimento, fiscalização e pagamento.",
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
    replaceMinutaTemplatePlaceholders(removeFixedClauseMarkerComments(recipe.template)),
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: MINUTA",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Número interno do processo: ${process.processNumber}`,
    `- Número da minuta/contrato: ${context.contractNumber ?? "XXX/2026"}`,
    `- Número do procedimento: ${context.procedureNumber ?? "XXX/2026"}`,
    `- Número da solicitação: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissão (pt-BR): ${context.issueDateBr}`,
    `- Data de emissão por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratação: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Unidade orçamentária principal: ${toDisplayText(budgetUnit)}`,
    `- Dotação orçamentária: ${context.budgetAllocation ?? "XXX"}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organização contratante: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da contratante: ${toDisplayText(context.organizationCnpj)}`,
    `- Endereço da contratante: ${organization.address ?? "XXX"}`,
    `- Município/UF: ${organization.city}/${organization.state}`,
    `- Autoridade da contratante: ${organization.authorityName ?? "XXX"}`,
    `- Cargo da autoridade: ${organization.authorityRole ?? "XXX"}`,
    `- Contratada: ${context.contractorName ?? "[CONTRATADA]"}`,
    `- CPF/CNPJ da contratada: ${context.contractorCnpj ?? "[CNPJ DA CONTRATADA]"}`,
    `- Endereço da contratada: ${context.contractorAddress ?? "[ENDEREÇO DA CONTRATADA]"}`,
    `- Representante legal da contratada: ${context.contractorRepresentative ?? "[REPRESENTANTE LEGAL]"}`,
    `- CPF do representante legal: ${context.contractorRepresentativeCpf ?? "[CPF DO REPRESENTANTE]"}`,
    ...sourceItemPromptLines(context, "SD"),
    `- Preço disponível: ${context.price.available ? "sim" : "não"}`,
    `- Valor bruto de referência: ${context.price.rawValue ?? "não informado"}`,
    `- Valor a usar na cláusula DO PREÇO: ${context.price.displayValue}`,
    `- Orientação para preço: ${context.price.guidance}`,
    `- Referência da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Regras para cláusulas fixas",
    `- Cláusulas fixas do template: ${fixedClauseTitles}.`,
    "- Copie as cláusulas fixas exatamente como estão no template.",
    "- A única alteração permitida nas cláusulas fixas é substituir placeholders por dados válidos presentes no contexto.",
    "- Não reescreva, resuma, simplifique, reorganize nem altere termos jurídicos das cláusulas fixas.",
    "",
    "## Instruções adicionais do operador",
    instructions ?? "Nenhuma instrução adicional informada.",
    "",
    "## Regras finais obrigatórias",
    "- Retorne somente a MINUTA DE CONTRATO final em Markdown.",
    "- Siga a estrutura do modelo canônico, mantendo todas as cláusulas contratuais.",
    "- Trate a Minuta como o instrumento que formaliza contratualmente a operação descrita pelo TR e pelos documentos do processo.",
    "- Converta contexto operacional em linguagem contratual: obrigações, condições de execução, fiscalização, recebimento, pagamento e consequências administrativas.",
    "- Preserve a arquitetura de cláusulas fixas, cláusulas semi-fixas, blocos condicionais e trechos contextuais.",
    "- Enriqueça as cláusulas semi-fixas de objeto, execução, pagamento, vigência, dotação, obrigações, fiscalização, recebimento, penalidades e extinção com contextualização contratual conservadora.",
    "- Use o pacote de contexto enriquecido e o plano documental para dar textura contratual ao objeto, sem copiar exemplos incompatíveis.",
    "- Mantenha obrigatoriamente a cláusula DO PREÇO.",
    "- Se o preço estiver indisponível ou informado como zero, use o placeholder R$ XX.XXX,XX.",
    "- Não inclua seções, títulos ou conteúdo de DFD, DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA, ETP, ESTUDO TÉCNICO PRELIMINAR, TR ou TERMO DE REFERÊNCIA.",
    "- Você pode reutilizar ou adaptar contexto de TR/ETP/SD apenas como conteúdo contratual, sem copiar headings desses documentos.",
    "- Não transforme a Minuta em TR, ETP, parecer jurídico, checklist ou contrato hiper detalhado.",
    "- Prefira cláusulas secas, placeholders preservados e pouca explicação sobre dados pendentes.",
    "- Evite repetição de ressalvas e condicionamentos em cláusulas simples.",
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

  if (documentType === "dfd" || documentType === "etp" || documentType === "tr") {
    sanitized = normalizeGeneratedClosingAlignmentHtml(sanitized);
    sanitized = removeAdministrativeClosingHeadings(sanitized);
    sanitized = removeSignatureSeparatorLines(sanitized);
  }

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
        "A estimativa será apurada em etapa própria, com pesquisa de preços compatível com o objeto e registro dos critérios adotados.",
      ]
        .join("\n")
        .trim();
    }
  }

  if (documentType === "minuta") {
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "R$ XX.XXX,XX");
    sanitized = removeFixedClauseMarkerComments(sanitized);
    sanitized = replaceMinutaTemplatePlaceholders(sanitized);

    if (!/clausula segunda\s+-\s+do preco/i.test(normalizeSearchText(sanitized))) {
      sanitized = insertMinutaClauseAfterFirstClause(
        sanitized,
        [
          "## CLÁUSULA SEGUNDA - DO PREÇO",
          "",
          "2.1. O valor do presente contrato é de R$ XX.XXX,XX.",
          "",
          "2.2. Nos preços estipulados estão inclusas todas as despesas necessárias ao fiel cumprimento do objeto.",
        ].join("\n"),
      );
    }

    sanitized = enforceMinutaFixedClauses(sanitized);
  }

  return sanitized;
}
