import type {
  ExpenseRequestExtractionResult,
  ExpenseRequestExtractionWarning,
} from "../model/processes";
import type {
  ProcessDepartmentReference,
  ProcessFormValues,
  ProcessOrganizationReference,
} from "./process-form-wizard";

export type SdImportSummary = {
  budgetUnitCode: string | null;
  budgetUnitName: string | null;
  fileName: string;
  organizationCnpj: string | null;
  organizationName: string | null;
  sourceReference: string | null;
  warnings: ExpenseRequestExtractionWarning[];
};

export type SdImportApplyResult = {
  summary: SdImportSummary;
  values: ProcessFormValues;
};

type ApplySdImportToProcessFormInput = {
  currentValues: ProcessFormValues;
  defaultOrganizationId?: string;
  departments: ProcessDepartmentReference[];
  extraction: ExpenseRequestExtractionResult;
  forcedOrganizationId?: string | null;
  organizations: ProcessOrganizationReference[];
  showOrganizationSelect: boolean;
};

const warningLabels: Record<ExpenseRequestExtractionWarning, string> = {
  budget_unit_code_missing: "Código da unidade orçamentária não encontrado na SD.",
  budget_unit_name_missing: "Nome da unidade orçamentária não encontrado na SD.",
  department_match_missing:
    "A unidade orçamentária da SD não foi encontrada nos departamentos disponíveis.",
  item_description_missing: "Descrição do item não encontrada na SD.",
  item_rows_missing: "Linhas de itens não foram encontradas na SD.",
  item_value_missing: "Valor do item não encontrado na SD.",
  organization_cnpj_missing: "CNPJ da organização não encontrado na SD.",
  organization_match_missing: "O CNPJ da SD não foi encontrado nas organizações disponíveis.",
  required_field_missing: "Campos obrigatórios da SD não foram encontrados.",
  responsible_name_missing: "Responsável não encontrado na SD.",
};

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeCnpj(value: string | null | undefined) {
  return cleanText(value).replace(/\D/g, "");
}

function normalizeBudgetUnitCode(value: string | null | undefined) {
  return cleanText(value).toLowerCase();
}

function addWarning(
  warnings: ExpenseRequestExtractionWarning[],
  warning: ExpenseRequestExtractionWarning,
) {
  return warnings.includes(warning) ? warnings : [...warnings, warning];
}

function findOrganizationMatch(
  organizations: ProcessOrganizationReference[],
  organizationCnpj: string | null,
) {
  const normalizedCnpj = normalizeCnpj(organizationCnpj);

  if (!normalizedCnpj) {
    return null;
  }

  const matches = organizations.filter(
    (organization) => normalizeCnpj(organization.cnpj) === normalizedCnpj,
  );

  return matches.length === 1 ? matches[0] : null;
}

function findDepartmentMatches({
  budgetUnitCode,
  departments,
  organizationId,
}: {
  budgetUnitCode: string | null;
  departments: ProcessDepartmentReference[];
  organizationId: string;
}) {
  const normalizedCode = normalizeBudgetUnitCode(budgetUnitCode);

  if (!normalizedCode || !organizationId) {
    return [];
  }

  return departments.filter(
    (department) =>
      department.organizationId === organizationId &&
      normalizeBudgetUnitCode(department.budgetUnitCode) === normalizedCode,
  );
}

export function getSdImportWarningLabel(warning: ExpenseRequestExtractionWarning) {
  return warningLabels[warning];
}

export function applySdImportToProcessForm({
  currentValues,
  defaultOrganizationId,
  departments,
  extraction,
  forcedOrganizationId,
  organizations,
  showOrganizationSelect,
}: ApplySdImportToProcessFormInput): SdImportApplyResult {
  const extractedFields = extraction.extractedFields;
  let warnings = [...extraction.warnings];
  const organizationMatch = showOrganizationSelect
    ? findOrganizationMatch(organizations, extractedFields.organizationCnpj)
    : null;
  const organizationId =
    forcedOrganizationId ??
    organizationMatch?.id ??
    currentValues.organizationId ??
    defaultOrganizationId ??
    "";

  if (showOrganizationSelect && extractedFields.organizationCnpj && !organizationMatch) {
    warnings = addWarning(warnings, "organization_match_missing");
  }

  const departmentMatches = findDepartmentMatches({
    budgetUnitCode: extractedFields.budgetUnitCode,
    departments,
    organizationId,
  });
  const departmentIds =
    departmentMatches.length === 1 ? [departmentMatches[0].id] : currentValues.departmentIds;

  if (extractedFields.budgetUnitCode && departmentMatches.length !== 1) {
    warnings = addWarning(warnings, "department_match_missing");
  }

  const suggestions = extraction.suggestions;
  const nextValues: ProcessFormValues = {
    ...currentValues,
    externalId:
      typeof suggestions.externalId === "string"
        ? suggestions.externalId
        : currentValues.externalId,
    issuedAt:
      typeof suggestions.issuedAt === "string" ? suggestions.issuedAt : currentValues.issuedAt,
    justification:
      typeof suggestions.justification === "string"
        ? suggestions.justification
        : currentValues.justification,
    object: typeof suggestions.object === "string" ? suggestions.object : currentValues.object,
    organizationId,
    processNumber:
      typeof suggestions.processNumber === "string"
        ? suggestions.processNumber
        : currentValues.processNumber,
    responsibleName:
      typeof suggestions.responsibleName === "string"
        ? suggestions.responsibleName
        : currentValues.responsibleName,
    title: typeof suggestions.title === "string" ? suggestions.title : currentValues.title,
    departmentIds,
    items: currentValues.items,
  };

  return {
    values: nextValues,
    summary: {
      budgetUnitCode: extractedFields.budgetUnitCode,
      budgetUnitName: extractedFields.budgetUnitName,
      fileName: extraction.fileName,
      organizationCnpj: extractedFields.organizationCnpj,
      organizationName: extractedFields.organizationName,
      sourceReference:
        typeof suggestions.sourceReference === "string" ? suggestions.sourceReference : null,
      warnings,
    },
  };
}
