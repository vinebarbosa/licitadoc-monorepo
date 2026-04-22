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

export function serializeDocumentSummary(document: StoredDocument) {
  return {
    id: document.id,
    name: document.name,
    organizationId: document.organizationId,
    processId: document.processId,
    type: document.type,
    status: document.status,
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

function compareDepartments(left: StoredDepartment, right: StoredDepartment) {
  return `${left.budgetUnitCode ?? ""}:${left.name}:${left.id}`.localeCompare(
    `${right.budgetUnitCode ?? ""}:${right.name}:${right.id}`,
  );
}

function formatDepartmentSummary(department: StoredDepartment) {
  const budgetUnitPrefix = department.budgetUnitCode ? `${department.budgetUnitCode} - ` : "";

  return `${budgetUnitPrefix}${department.name}`;
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
    organizationCnpj: firstText(getExtractedTextField(process, "organizationCnpj"), organization.cnpj),
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

  if (documentType !== "dfd") {
    return trimmed;
  }

  const lines = trimmed.split(/\r?\n/);
  const stopIndex = lines.findIndex((line) => {
    const normalizedLine = normalizeSearchText(line);

    return /^(#{1,6}\s*)?(\d+[.)]?\s*)?(estudo tecnico preliminar|etp|termo de referencia|tr)\b/.test(
      normalizedLine,
    );
  });

  const sanitized = (stopIndex === -1 ? lines : lines.slice(0, stopIndex)).join("\n").trim();

  return sanitized;
}
