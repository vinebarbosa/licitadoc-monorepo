import { eq, type SQL } from "drizzle-orm";
import type { Actor } from "../../authorization/actor";
import type { departments, organizations, processes } from "../../db";
import { documents } from "../../db";
import type { GeneratedDocumentType } from "../../shared/text-generation/types";
import { resolveDocumentGenerationRecipe } from "./document-generation-recipes";

export type StoredDocument = typeof documents.$inferSelect;
export type StoredDepartment = typeof departments.$inferSelect;
export type StoredOrganization = typeof organizations.$inferSelect;
export type StoredProcess = typeof processes.$inferSelect;

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
  return firstText(value) ?? "nao informado";
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
      displayValue: "nao informado",
      guidance: "Estimativa nao informada no contexto; sera objeto de apuracao posterior.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "nao informado",
      guidance:
        "Valor ausente ou informado como zero; tratar como ausencia de estimativa e indicar apuracao posterior.",
      rawValue: value,
    };
  }

  return {
    available: true,
    displayValue: value,
    guidance:
      "Estimativa disponivel no contexto; usar somente este valor, sem extrapolar ou complementar.",
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
        "Preco nao informado no contexto; manter placeholder e nao simular valor contratual.",
      rawValue: null,
    };
  }

  const amount = normalizeMonetaryNumber(value);

  if (amount === null || amount === 0) {
    return {
      available: false,
      displayValue: "R$ XX.XXX,XX",
      guidance:
        "Valor ausente ou informado como zero; tratar como ausencia de preco e manter placeholder.",
      rawValue: value,
    };
  }

  return {
    available: true,
    displayValue: value,
    guidance: "Preco disponivel no contexto; usar somente este valor, sem extrapolar.",
    rawValue: value,
  };
}

function buildGenericDocumentGenerationPrompt({
  documentType,
  instructions,
  organization,
  process,
}: {
  documentType: GeneratedDocumentType;
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  return [
    "Voce e um assistente especializado em documentos administrativos e juridicos para prefeituras brasileiras.",
    "Gere um rascunho claro, estruturado e revisavel. Nao declare aprovacao juridica final.",
    "",
    `Tipo de documento: ${documentType.toUpperCase()}`,
    "",
    "Dados da organizacao:",
    `Nome: ${organization.name}`,
    `Nome oficial: ${organization.officialName}`,
    `CNPJ: ${organization.cnpj}`,
    `Municipio/UF: ${organization.city}/${organization.state}`,
    `Autoridade: ${organization.authorityName} - ${organization.authorityRole}`,
    "",
    "Dados do processo:",
    `Tipo: ${process.type}`,
    `Numero: ${process.processNumber}`,
    `Identificador externo: ${process.externalId ?? "nao informado"}`,
    `Data de emissao: ${process.issuedAt.toISOString()}`,
    `Objeto: ${process.object}`,
    `Justificativa: ${process.justification}`,
    `Responsavel: ${process.responsibleName}`,
    `Status: ${process.status}`,
    "",
    "Instrucoes adicionais do operador:",
    instructions ?? "Nenhuma instrucao adicional informada.",
  ].join("\n");
}

export function buildDfdGenerationContext({
  departments,
  organization,
  process,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const sortedDepartments = [...departments].sort(compareDepartments);
  const primaryDepartment = sortedDepartments[0] ?? null;

  return {
    budgetUnitCode: firstText(
      getExtractedTextField(process, "budgetUnitCode"),
      primaryDepartment?.budgetUnitCode,
    ),
    budgetUnitName: firstText(
      getExtractedTextField(process, "budgetUnitName"),
      primaryDepartment?.name,
    ),
    departmentSummary:
      sortedDepartments.length > 0
        ? sortedDepartments.map(formatDepartmentSummary).join("; ")
        : "nenhum departamento vinculado",
    issueDateBr: formatDateBr(process.issuedAt),
    issueDateLongBr: formatDateLongBr(process.issuedAt),
    object: firstText(getExtractedTextField(process, "object"), process.object),
    organizationCnpj: firstText(
      getExtractedTextField(process, "organizationCnpj"),
      organization.cnpj,
    ),
    organizationName: firstText(
      getExtractedTextField(process, "organizationName"),
      organization.officialName,
      organization.name,
    ),
    processType: firstText(getExtractedTextField(process, "processType"), process.type),
    requestNumber: firstText(getExtractedTextField(process, "requestNumber"), process.externalId),
    requester: firstText(
      getExtractedTextField(process, "budgetUnitName"),
      primaryDepartment?.name,
      organization.name,
    ),
    responsibleName: firstText(
      getExtractedTextField(process, "responsibleName"),
      process.responsibleName,
      primaryDepartment?.responsibleName,
    ),
    responsibleRole: firstText(
      getExtractedTextField(process, "responsibleRole"),
      primaryDepartment?.responsibleRole,
    ),
    sourceKind: firstText(process.sourceKind),
    sourceReference: firstText(process.sourceReference),
    warnings: getWarnings(process),
  };
}

export function buildEtpGenerationContext({
  departments,
  organization,
  process,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const dfdContext = buildDfdGenerationContext({
    departments,
    organization,
    process,
  });
  const rawEstimate = firstText(
    getExtractedValue(process, "totalValue"),
    getExtractedValue(process, "estimatedValue"),
    getExtractedValue(process, "estimateValue"),
    getExtractedValue(process, "contractValue"),
    getExtractedValue(process, "value"),
    getExtractedValue(process, "item.totalValue"),
    getExtractedValue(process, "item.unitValue"),
  );
  const estimate = normalizeEtpEstimate(rawEstimate);

  return {
    ...dfdContext,
    estimate,
    itemDescription: firstText(getExtractedValue(process, "item.description")),
    itemQuantity: firstText(getExtractedValue(process, "item.quantity")),
    itemUnit: firstText(getExtractedValue(process, "item.unit")),
    processJustification: firstText(process.justification),
  };
}

function inferTrContractingType(contextText: string) {
  const normalizedText = normalizeSearchText(contextText);

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

  return "prestacao_servicos_gerais";
}

export function buildTrGenerationContext({
  departments,
  organization,
  process,
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const etpContext = buildEtpGenerationContext({
    departments,
    organization,
    process,
  });
  const contractingType = inferTrContractingType(
    [
      etpContext.object,
      etpContext.itemDescription,
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
}: {
  departments: StoredDepartment[];
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const trContext = buildTrGenerationContext({
    departments,
    organization,
    process,
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
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const recipe = resolveDocumentGenerationRecipe("dfd");

  if (!recipe) {
    throw new Error("DFD recipe is not configured.");
  }

  const context = buildDfdGenerationContext({
    departments,
    organization,
    process,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canonico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: DFD",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Numero interno do processo: ${process.processNumber}`,
    `- Numero da solicitacao: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissao (pt-BR): ${context.issueDateBr}`,
    `- Data de emissao por extenso: ${context.issueDateLongBr}`,
    `- Objeto da solicitacao: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(process.justification)}`,
    `- Responsavel pela solicitacao: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsavel: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orcamentaria principal: ${toDisplayText(budgetUnit)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organizacao: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da organizacao: ${toDisplayText(context.organizationCnpj)}`,
    `- Municipio/UF: ${organization.city}/${organization.state}`,
    `- Referencia da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Instrucoes adicionais do operador",
    instructions ?? "Nenhuma instrucao adicional informada.",
    "",
    "## Regras finais obrigatorias",
    "- Retorne somente o DFD final em Markdown.",
    "- Siga a estrutura do modelo canonico.",
    "- Nao inclua secoes, titulos ou conteudo de ETP, ESTUDO TECNICO PRELIMINAR, TR ou TERMO DE REFERENCIA.",
    "- Se algum dado estiver ausente, explicite a ausencia sem inventar fatos.",
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
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const recipe = resolveDocumentGenerationRecipe("etp");

  if (!recipe) {
    throw new Error("ETP recipe is not configured.");
  }

  const context = buildEtpGenerationContext({
    departments,
    organization,
    process,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canonico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: ETP",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Numero interno do processo: ${process.processNumber}`,
    `- Numero da solicitacao: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissao (pt-BR): ${context.issueDateBr}`,
    `- Data de emissao por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratacao: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Responsavel: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsavel: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orcamentaria principal: ${toDisplayText(budgetUnit)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organizacao: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da organizacao: ${toDisplayText(context.organizationCnpj)}`,
    `- Municipio/UF: ${organization.city}/${organization.state}`,
    `- Descricao do item da SD: ${toDisplayText(context.itemDescription)}`,
    `- Quantidade do item da SD: ${toDisplayText(context.itemQuantity)}`,
    `- Unidade do item da SD: ${toDisplayText(context.itemUnit)}`,
    `- Estimativa disponivel: ${context.estimate.available ? "sim" : "nao"}`,
    `- Valor bruto extraido da origem: ${context.estimate.rawValue ?? "nao informado"}`,
    `- Valor a usar na secao de estimativa: ${context.estimate.displayValue}`,
    `- Orientacao para estimativa: ${context.estimate.guidance}`,
    `- Referencia da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Instrucoes adicionais do operador",
    instructions ?? "Nenhuma instrucao adicional informada.",
    "",
    "## Regras finais obrigatorias",
    "- Retorne somente o ETP final em Markdown.",
    "- Siga a estrutura do modelo canonico, mantendo a secao ESTIMATIVA DO VALOR DA CONTRATACAO.",
    "- Nao inclua secoes, titulos ou conteudo de DFD, DOCUMENTO DE FORMALIZACAO DE DEMANDA, TR ou TERMO DE REFERENCIA.",
    "- Voce pode reutilizar ou adaptar contexto de DFD/SD apenas como conteudo narrativo, sem copiar headings de DFD.",
    "- Se a estimativa estiver indisponivel, use linguagem como nao informado, nao consta no contexto ou sera objeto de apuracao posterior.",
    "- Nao invente valores e nao simule pesquisa de mercado.",
  ].join("\n");
}

function buildTrGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const recipe = resolveDocumentGenerationRecipe("tr");

  if (!recipe) {
    throw new Error("TR recipe is not configured.");
  }

  const context = buildTrGenerationContext({
    departments,
    organization,
    process,
  });
  const budgetUnit = [context.budgetUnitCode, context.budgetUnitName]
    .filter((value): value is string => Boolean(value))
    .join(" - ");

  return [
    recipe.instructions,
    "",
    "## Modelo Markdown canonico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: TR",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Tipo de contratacao inferido para obrigacoes: ${context.contractingType}`,
    `- Numero interno do processo: ${process.processNumber}`,
    `- Numero da solicitacao: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissao (pt-BR): ${context.issueDateBr}`,
    `- Data de emissao por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratacao: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Responsavel: ${toDisplayText(context.responsibleName)}`,
    `- Cargo do responsavel: ${toDisplayText(context.responsibleRole)}`,
    `- Unidade orcamentaria principal: ${toDisplayText(budgetUnit)}`,
    `- Solicitante: ${toDisplayText(context.requester)}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organizacao: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da organizacao: ${toDisplayText(context.organizationCnpj)}`,
    `- Municipio/UF: ${organization.city}/${organization.state}`,
    `- Descricao do item da SD: ${toDisplayText(context.itemDescription)}`,
    `- Quantidade do item da SD: ${toDisplayText(context.itemQuantity)}`,
    `- Unidade do item da SD: ${toDisplayText(context.itemUnit)}`,
    `- Estimativa disponivel: ${context.estimate.available ? "sim" : "nao"}`,
    `- Valor bruto extraido da origem: ${context.estimate.rawValue ?? "nao informado"}`,
    `- Valor a usar na secao de valor estimado: ${context.estimate.displayValue}`,
    `- Orientacao para valor estimado: ${context.estimate.guidance}`,
    `- Referencia da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Orientacao para obrigacoes",
    `- Use prioritariamente o bloco Tipo: ${context.contractingType} da secao Obrigacoes por tipo de contratacao.`,
    "- Adapte as obrigacoes ao objeto e ao contexto especifico.",
    "- Nao copie obrigacoes incompatíveis com o objeto.",
    "- Nao misture blocos de tipos diferentes sem necessidade demonstrada no contexto.",
    "",
    "## Instrucoes adicionais do operador",
    instructions ?? "Nenhuma instrucao adicional informada.",
    "",
    "## Regras finais obrigatorias",
    "- Retorne somente o TR final em Markdown.",
    "- Siga a estrutura do modelo canonico, mantendo a secao VALOR ESTIMADO E DOTACAO ORCAMENTARIA.",
    "- Nao inclua secoes, titulos ou conteudo de DFD, DOCUMENTO DE FORMALIZACAO DE DEMANDA, ETP ou ESTUDO TECNICO PRELIMINAR.",
    "- Nao inclua headings como DADOS DA SOLICITACAO, LEVANTAMENTO DE MERCADO ou ANALISE DE ALTERNATIVAS.",
    "- Voce pode reutilizar ou adaptar contexto de DFD/ETP/SD apenas como conteudo operacional, sem copiar headings desses documentos.",
    "- Se a estimativa estiver indisponivel, indique que o valor sera apurado posteriormente por pesquisa de mercado ou etapa propria.",
    "- Nao invente valores, dados tecnicos, datas, locais, duracoes, infraestrutura, condicoes de pagamento ou sancoes especificas.",
  ].join("\n");
}

function buildMinutaGenerationPrompt({
  departments,
  instructions,
  organization,
  process,
}: {
  departments: StoredDepartment[];
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  const recipe = resolveDocumentGenerationRecipe("minuta");

  if (!recipe) {
    throw new Error("Minuta recipe is not configured.");
  }

  const context = buildMinutaGenerationContext({
    departments,
    organization,
    process,
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
    "## Modelo Markdown canonico",
    recipe.template,
    "",
    "## Contexto estruturado do processo",
    "- Tipo de documento: MINUTA",
    `- Tipo do processo administrativo: ${toDisplayText(context.processType)}`,
    `- Tipo de contratacao inferido para obrigacoes: ${context.contractingType}`,
    `- Numero interno do processo: ${process.processNumber}`,
    `- Numero da minuta/contrato: ${context.contractNumber ?? "XXX/2026"}`,
    `- Numero do procedimento: ${context.procedureNumber ?? "XXX/2026"}`,
    `- Numero da solicitacao: ${toDisplayText(context.requestNumber)}`,
    `- Data de emissao (pt-BR): ${context.issueDateBr}`,
    `- Data de emissao por extenso: ${context.issueDateLongBr}`,
    `- Objeto da contratacao: ${toDisplayText(context.object)}`,
    `- Justificativa do processo: ${toDisplayText(context.processJustification)}`,
    `- Unidade orcamentaria principal: ${toDisplayText(budgetUnit)}`,
    `- Dotacao orcamentaria: ${context.budgetAllocation ?? "{{budget.allocation_or_placeholder}}"}`,
    `- Departamentos vinculados: ${context.departmentSummary}`,
    `- Organizacao contratante: ${toDisplayText(context.organizationName)}`,
    `- CNPJ da contratante: ${toDisplayText(context.organizationCnpj)}`,
    `- Endereco da contratante: ${organization.address ?? "{{organization.address_or_placeholder}}"}`,
    `- Municipio/UF: ${organization.city}/${organization.state}`,
    `- Autoridade da contratante: ${organization.authorityName ?? "{{organization.authorityName_or_placeholder}}"}`,
    `- Cargo da autoridade: ${organization.authorityRole ?? "{{organization.authorityRole_or_placeholder}}"}`,
    `- Contratada: ${context.contractorName ?? "[CONTRATADA]"}`,
    `- CPF/CNPJ da contratada: ${context.contractorCnpj ?? "[CNPJ DA CONTRATADA]"}`,
    `- Endereco da contratada: ${context.contractorAddress ?? "[ENDERECO DA CONTRATADA]"}`,
    `- Representante legal da contratada: ${context.contractorRepresentative ?? "[REPRESENTANTE LEGAL]"}`,
    `- CPF do representante legal: ${context.contractorRepresentativeCpf ?? "[CPF DO REPRESENTANTE]"}`,
    `- Descricao do item da SD: ${toDisplayText(context.itemDescription)}`,
    `- Quantidade do item da SD: ${toDisplayText(context.itemQuantity)}`,
    `- Unidade do item da SD: ${toDisplayText(context.itemUnit)}`,
    `- Preco disponivel: ${context.price.available ? "sim" : "nao"}`,
    `- Valor bruto extraido da origem: ${context.price.rawValue ?? "nao informado"}`,
    `- Valor a usar na clausula DO PRECO: ${context.price.displayValue}`,
    `- Orientacao para preco: ${context.price.guidance}`,
    `- Referencia da origem: ${toDisplayText(context.sourceReference)}`,
    `- Tipo da origem: ${toDisplayText(context.sourceKind)}`,
    `- Status atual do processo: ${process.status}`,
    `- Avisos da origem: ${context.warnings.length > 0 ? context.warnings.join("; ") : "nenhum"}`,
    "",
    "## Orientacao para obrigacoes",
    "- Derive obrigacoes prioritariamente de TR quando houver conteudo disponivel no contexto.",
    `- Use prioritariamente o bloco Tipo: ${context.contractingType} da secao Obrigacoes por tipo de contratacao quando nao houver TR suficiente.`,
    "- Adapte as obrigacoes ao objeto e ao contexto especifico, sempre em linguagem contratual.",
    "- Nao copie obrigacoes incompatíveis com o objeto.",
    "- Nao misture blocos de tipos diferentes sem necessidade demonstrada no contexto.",
    "",
    "## Regras para clausulas FIXED",
    `- Clausulas FIXED do template: ${fixedClauseTitles}.`,
    "- Copie as clausulas FIXED exatamente como estao no template.",
    "- A unica alteracao permitida nas clausulas FIXED e substituir placeholders por dados validos presentes no contexto.",
    "- Nao reescreva, resuma, simplifique, reorganize nem altere termos juridicos das clausulas FIXED.",
    "",
    "## Instrucoes adicionais do operador",
    instructions ?? "Nenhuma instrucao adicional informada.",
    "",
    "## Regras finais obrigatorias",
    "- Retorne somente a MINUTA DE CONTRATO final em Markdown.",
    "- Siga a estrutura do modelo canonico, mantendo todas as clausulas contratuais.",
    "- Mantenha obrigatoriamente a clausula DO PRECO.",
    "- Se o preco estiver indisponivel ou informado como zero, use o placeholder R$ XX.XXX,XX.",
    "- Nao inclua secoes, titulos ou conteudo de DFD, DOCUMENTO DE FORMALIZACAO DE DEMANDA, ETP, ESTUDO TECNICO PRELIMINAR, TR ou TERMO DE REFERENCIA.",
    "- Voce pode reutilizar ou adaptar contexto de TR/ETP/SD apenas como conteudo contratual, sem copiar headings desses documentos.",
    "- Nao invente valores, nomes, CPF, CNPJ, enderecos, datas, locais, prazos, dotacoes ou dados de execucao.",
  ].join("\n");
}

export function buildDocumentGenerationPrompt({
  departments = [],
  documentType,
  instructions,
  organization,
  process,
}: {
  departments?: StoredDepartment[];
  documentType: GeneratedDocumentType;
  instructions: string | null;
  organization: StoredOrganization;
  process: StoredProcess;
}) {
  if (documentType === "dfd") {
    return buildDfdGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
    });
  }

  if (documentType === "etp") {
    return buildEtpGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
    });
  }

  if (documentType === "tr") {
    return buildTrGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
    });
  }

  if (documentType === "minuta") {
    return buildMinutaGenerationPrompt({
      departments,
      instructions,
      organization,
      process,
    });
  }

  return buildGenericDocumentGenerationPrompt({
    documentType,
    instructions,
    organization,
    process,
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
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "nao informado");

    if (!/estimativa do valor da contratacao/i.test(normalizeSearchText(sanitized))) {
      sanitized = [
        sanitized,
        "",
        "## 5. ESTIMATIVA DO VALOR DA CONTRATACAO",
        "",
        "Valor nao informado no contexto; a estimativa sera objeto de apuracao posterior.",
      ]
        .join("\n")
        .trim();
    }
  }

  if (documentType === "tr") {
    sanitized = sanitized.replace(/\bR\$\s*0+(?:[,.]0{1,2})?\b/g, "nao informado");

    if (!/valor estimado e dotacao orcamentaria/i.test(normalizeSearchText(sanitized))) {
      sanitized = [
        sanitized,
        "",
        "## 7. VALOR ESTIMADO E DOTACAO ORCAMENTARIA",
        "",
        "Valor nao informado no contexto; a estimativa sera apurada posteriormente por pesquisa de mercado ou etapa propria.",
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
        "## CLAUSULA SEGUNDA - DO PRECO",
        "",
        "2.1. O valor do presente contrato e de `R$ XX.XXX,XX`.",
        "",
        "2.2. O preco nao consta no contexto ou foi informado como zero; por isso, devera ser preenchido em etapa propria, sem simulacao de valores.",
      ]
        .join("\n")
        .trim();
    }

    sanitized = enforceMinutaFixedClauses(sanitized);
  }

  return sanitized;
}
