import { AlertTriangle, CheckCircle2, Clock3, type LucideIcon } from "lucide-react";

import type {
  ProcessCreateRequest,
  ProcessDepartmentListItem,
  ProcessDetailDocument,
  ProcessDetailResponse,
  ProcessesListItem,
  ProcessesListQueryParams,
  ProcessOrganizationListItem,
} from "../api/processes";

export type ProcessStatus = "finalizado" | "em_edicao" | "em_revisao" | "erro";
export type ProcessCreationStatus = "draft" | "em_edicao" | "em_revisao" | "finalizado";
export type ProcessDetailDocumentStatus = ProcessDetailDocument["status"];

export type ProcessCreationFormValues = {
  type: string;
  processNumber: string;
  externalId: string;
  issuedAt: string;
  object: string;
  justification: string;
  responsibleName: string;
  status: ProcessCreationStatus;
  organizationId: string;
  departmentIds: string[];
  sourceKind: string | null;
  sourceReference: string | null;
  sourceMetadata: Record<string, unknown> | null;
};

export type ProcessCreationFormErrors = Partial<
  Record<keyof ProcessCreationFormValues | "form", string>
>;

export type ProcessCreationActor = {
  role: "admin" | "organization_owner" | "member" | null;
  organizationId: string | null;
};

export type ProcessDepartmentOption = {
  id: string;
  label: string;
  organizationId: string;
  budgetUnitCode: string | null;
};

export type ProcessOrganizationOption = {
  id: string;
  label: string;
  cnpj: string;
};

export type ExpenseRequestExtractionWarning =
  | "organization_cnpj_missing"
  | "budget_unit_code_missing"
  | "budget_unit_name_missing"
  | "item_description_missing"
  | "item_value_missing"
  | "responsible_name_missing"
  | "required_field_missing"
  | "organization_match_missing"
  | "department_match_missing";

export type ExpenseRequestExtractionItem = {
  code: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
};

export type ExpenseRequestExtractionResult = {
  fileName: string;
  rawText: string;
  suggestions: Partial<ProcessCreationFormValues>;
  extractedFields: {
    budgetUnitCode: string | null;
    budgetUnitName: string | null;
    issueDate: string | null;
    itemDescription: string | null;
    item: ExpenseRequestExtractionItem;
    object: string | null;
    organizationCnpj: string | null;
    organizationName: string | null;
    processType: string | null;
    requestNumber: string | null;
    responsibleName: string | null;
    responsibleRole: string | null;
    totalValue: string | null;
  };
  warnings: ExpenseRequestExtractionWarning[];
};

export type ProcessesFilters = {
  page: number;
  search: string;
  status: ProcessStatus | "todos";
  type: string | "todos";
};

export const PROCESSES_PAGE_SIZE = 10;

export const statusOptions: Array<{ value: ProcessStatus; label: string }> = [
  { value: "em_edicao", label: "Em edicao" },
  { value: "em_revisao", label: "Em revisao" },
  { value: "finalizado", label: "Finalizado" },
  { value: "erro", label: "Com erro" },
];

export const processTypeOptions = [
  { value: "pregao-eletronico", label: "Pregao Eletronico" },
  { value: "concorrencia", label: "Concorrencia" },
  { value: "tomada-de-precos", label: "Tomada de Precos" },
  { value: "inexigibilidade", label: "Inexigibilidade" },
  { value: "pregao", label: "Pregao" },
] as const;

export const processCreationStatusOptions: Array<{ value: ProcessCreationStatus; label: string }> =
  [
    { value: "draft", label: "Rascunho" },
    { value: "em_edicao", label: "Em edicao" },
    { value: "em_revisao", label: "Em revisao" },
    { value: "finalizado", label: "Finalizado" },
  ];

export const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  finalizado: {
    label: "Finalizado",
    className: "bg-success/15 text-success border-success/30",
  },
  em_edicao: {
    label: "Em edicao",
    className: "bg-pending/15 text-pending border-pending/30",
  },
  em_revisao: {
    label: "Em revisao",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  erro: {
    label: "Erro",
    className: "bg-critical/15 text-critical border-critical/30",
  },
};

export const processDetailDocumentStatusConfig: Record<
  ProcessDetailDocumentStatus,
  { label: string; className: string; icon: LucideIcon; iconName: string }
> = {
  concluido: {
    label: "Concluido",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
    iconName: "check-circle-2",
  },
  em_edicao: {
    label: "Em edicao",
    className: "bg-pending/15 text-pending border-pending/30",
    icon: Clock3,
    iconName: "clock-3",
  },
  pendente: {
    label: "Pendente",
    className: "bg-muted text-muted-foreground border-muted",
    icon: Clock3,
    iconName: "clock-3",
  },
  erro: {
    label: "Erro",
    className: "bg-critical/15 text-critical border-critical/30",
    icon: AlertTriangle,
    iconName: "alert-triangle",
  },
};

const statusFallbackConfig = {
  label: "Em edicao",
  className: statusConfig.em_edicao.className,
};

export function getDefaultProcessesFilters(searchParams: URLSearchParams): ProcessesFilters {
  const page = Number(searchParams.get("page") ?? "1");
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParams.get("search") ?? "",
    status: isProcessStatus(status) ? status : "todos",
    type: type && type.length > 0 ? type : "todos",
  };
}

export function getProcessesQueryParams(filters: ProcessesFilters): ProcessesListQueryParams {
  return {
    page: filters.page,
    pageSize: PROCESSES_PAGE_SIZE,
    search: filters.search.trim() || undefined,
    status: filters.status === "todos" ? undefined : filters.status,
    type: filters.type === "todos" ? undefined : filters.type,
  };
}

export function getProcessesFilterSearchParams(filters: ProcessesFilters) {
  const searchParams = new URLSearchParams();

  if (filters.page > 1) {
    searchParams.set("page", String(filters.page));
  }

  if (filters.search.trim().length > 0) {
    searchParams.set("search", filters.search.trim());
  }

  if (filters.status !== "todos") {
    searchParams.set("status", filters.status);
  }

  if (filters.type !== "todos") {
    searchParams.set("type", filters.type);
  }

  return searchParams;
}

export function getProcessStatusConfig(status: string) {
  return isProcessStatus(status) ? statusConfig[status] : statusFallbackConfig;
}

export function getProcessTypeLabel(type: string) {
  return processTypeOptions.find((option) => option.value === type)?.label ?? type;
}

export function formatProcessListDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatProcessDetailDate(dateString: string | null) {
  if (!dateString) {
    return "Nao informado";
  }

  return formatProcessListDate(dateString);
}

export function getProcessDisplayName(process: ProcessesListItem) {
  return process.object;
}

export function getProcessDetailDisplayName(process: Pick<ProcessDetailResponse, "object">) {
  return process.object;
}

export function getProcessDetailPath(process: ProcessesListItem) {
  return `/app/processo/${process.id}`;
}

export function getProcessPreviewPath(processId: string) {
  return `/app/processo/${processId}/visualizar`;
}

export function getProcessEditPath(processId: string) {
  return `/app/processo/${processId}/editar`;
}

export function getProcessDetailBreadcrumbs(
  process: Pick<ProcessDetailResponse, "processNumber"> | null | undefined,
) {
  return [
    { label: "Central de Trabalho", href: "/app" },
    { label: "Processos", href: "/app/processos" },
    { label: process?.processNumber ?? "Detalhe do Processo" },
  ];
}

export function getProcessDetailDepartmentLabel(
  process: Pick<ProcessDetailResponse, "departments">,
) {
  if (process.departments.length === 0) {
    return "Sem departamento";
  }

  return process.departments.map((department) => department.label).join(", ");
}

export function getProcessEstimatedValueLabel(estimatedValue: string | null) {
  if (!estimatedValue) {
    return "Nao informado";
  }

  const trimmedValue = estimatedValue.trim();

  if (trimmedValue.startsWith("R$")) {
    return trimmedValue;
  }

  const numericValue = Number(trimmedValue);

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return trimmedValue;
}

export function getProcessDetailDocumentStatusConfig(status: ProcessDetailDocumentStatus) {
  return processDetailDocumentStatusConfig[status];
}

export function getProcessDetailDocumentActionLinks(
  processId: string,
  document: Pick<ProcessDetailDocument, "type" | "documentId" | "availableActions">,
) {
  const encodedType = encodeURIComponent(document.type);

  return {
    createHref: document.availableActions.create
      ? `/app/documento/novo?tipo=${encodedType}&processo=${processId}`
      : null,
    editHref:
      document.availableActions.edit && document.documentId
        ? `/app/documento/${document.documentId}`
        : null,
    viewHref:
      document.availableActions.view && document.documentId
        ? `/app/documento/${document.documentId}/preview`
        : null,
  };
}

export function getDefaultProcessCreationFormValues(
  actor: ProcessCreationActor,
): ProcessCreationFormValues {
  return {
    type: "pregao",
    processNumber: "",
    externalId: "",
    issuedAt: "",
    object: "",
    justification: "",
    responsibleName: "",
    status: "draft",
    organizationId: actor.role === "admin" ? "" : (actor.organizationId ?? ""),
    departmentIds: [],
    sourceKind: null,
    sourceReference: null,
    sourceMetadata: null,
  };
}

export function mapDepartmentOptions(departments: ProcessDepartmentListItem[]) {
  return departments.map((department) => ({
    id: department.id,
    label: department.budgetUnitCode
      ? `${department.budgetUnitCode} - ${department.name}`
      : department.name,
    organizationId: department.organizationId,
    budgetUnitCode: department.budgetUnitCode,
  }));
}

export function mapOrganizationOptions(organizations: ProcessOrganizationListItem[]) {
  return organizations.map((organization) => ({
    id: organization.id,
    label: organization.name,
    cnpj: organization.cnpj,
  }));
}

export function filterDepartmentsForOrganization(
  departments: ProcessDepartmentOption[],
  organizationId: string,
) {
  return organizationId
    ? departments.filter((department) => department.organizationId === organizationId)
    : departments;
}

export function normalizeDateInput(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().slice(0, 10);
}

export function validateProcessCreationForm(
  values: ProcessCreationFormValues,
  actor: ProcessCreationActor,
): ProcessCreationFormErrors {
  const errors: ProcessCreationFormErrors = {};

  if (actor.role === "admin" && !values.organizationId.trim()) {
    errors.organizationId = "Selecione a organizacao.";
  }

  if (!values.type.trim()) {
    errors.type = "Informe o tipo.";
  }

  if (!values.processNumber.trim()) {
    errors.processNumber = "Informe o numero do processo.";
  }

  if (!values.issuedAt.trim()) {
    errors.issuedAt = "Informe a data de emissao.";
  } else if (Number.isNaN(Date.parse(values.issuedAt))) {
    errors.issuedAt = "Informe uma data valida.";
  }

  if (!values.object.trim()) {
    errors.object = "Informe o objeto.";
  }

  if (!values.justification.trim()) {
    errors.justification = "Informe a justificativa.";
  }

  if (!values.responsibleName.trim()) {
    errors.responsibleName = "Informe o responsavel.";
  }

  if (values.departmentIds.length === 0) {
    errors.departmentIds = "Selecione ao menos um departamento.";
  }

  return errors;
}

export function hasProcessCreationErrors(errors: ProcessCreationFormErrors) {
  return Object.keys(errors).length > 0;
}

export function buildProcessCreateRequest(
  values: ProcessCreationFormValues,
  actor: ProcessCreationActor,
): ProcessCreateRequest {
  return {
    type: values.type.trim(),
    processNumber: values.processNumber.trim(),
    externalId: values.externalId.trim() || null,
    issuedAt: new Date(values.issuedAt).toISOString(),
    object: values.object.trim(),
    justification: values.justification.trim(),
    responsibleName: values.responsibleName.trim(),
    status: values.status,
    departmentIds: values.departmentIds,
    ...(actor.role === "admin" || values.organizationId !== actor.organizationId
      ? { organizationId: values.organizationId }
      : {}),
    sourceKind: values.sourceKind,
    sourceReference: values.sourceReference,
    sourceMetadata: values.sourceMetadata,
  };
}

export function getProcessCreateErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string" &&
    error.data.message.length > 0
  ) {
    return error.data.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  return "Nao foi possivel criar o processo.";
}

export function getProcessDetailErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string" &&
    error.data.message.length > 0
  ) {
    return error.data.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.length > 0
  ) {
    return error.message;
  }

  return "Nao foi possivel carregar o processo.";
}

export function applyExtractionToFormValues(
  currentValues: ProcessCreationFormValues,
  extraction: ExpenseRequestExtractionResult,
  dirtyFields: Partial<Record<keyof ProcessCreationFormValues, boolean>> = {},
) {
  const nextValues = { ...currentValues };
  const entries = Object.entries(extraction.suggestions) as Array<
    [keyof ProcessCreationFormValues, ProcessCreationFormValues[keyof ProcessCreationFormValues]]
  >;

  for (const [key, value] of entries) {
    if (dirtyFields[key] || value == null) {
      continue;
    }

    nextValues[key] = value as never;
  }

  return nextValues;
}

function isProcessStatus(value: string | null): value is ProcessStatus {
  return (
    value === "finalizado" || value === "em_edicao" || value === "em_revisao" || value === "erro"
  );
}
