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
  title: string;
  object: string;
  justification: string;
  responsibleName: string;
  status: ProcessCreationStatus;
  organizationId: string;
  departmentIds: string[];
  sourceKind: string | null;
  sourceReference: string | null;
  sourceMetadata: Record<string, unknown> | null;
  expenseRequestItems: ExpenseRequestFormItem[];
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
  | "item_rows_missing"
  | "responsible_name_missing"
  | "required_field_missing"
  | "organization_match_missing"
  | "department_match_missing";

export type ExpenseRequestExtractionItem = {
  code: string | null;
  title?: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
};

export type ExpenseRequestFormItemKind = "simple" | "kit";

export type ExpenseRequestFormItemComponent = {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
};

export type ExpenseRequestFormItem = {
  id: string;
  kind: ExpenseRequestFormItemKind;
  code: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  unitValue: string;
  totalValue: string;
  components: ExpenseRequestFormItemComponent[];
  source: "manual" | "pdf";
};

export type ProcessDetailSourceItemComponent = {
  id: string;
  title: string;
  description: string | null;
  quantity: string | null;
  unit: string | null;
};

export type ProcessDetailSourceItem = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
  components: ProcessDetailSourceItemComponent[];
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
    items?: ExpenseRequestExtractionItem[];
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
  procurementMethod: string | "todos";
};

export const PROCESSES_PAGE_SIZE = 10;

export const statusOptions: Array<{ value: ProcessStatus; label: string }> = [
  { value: "em_edicao", label: "Em edição" },
  { value: "em_revisao", label: "Em revisão" },
  { value: "finalizado", label: "Finalizado" },
  { value: "erro", label: "Com erro" },
];

export const processTypeOptions = [
  { value: "pregao-eletronico", label: "Pregão Eletrônico" },
  { value: "concorrencia", label: "Concorrência" },
  { value: "tomada-de-precos", label: "Tomada de Preços" },
  { value: "inexigibilidade", label: "Inexigibilidade" },
  { value: "pregao", label: "Pregão" },
] as const;

export const processCreationStatusOptions: Array<{ value: ProcessCreationStatus; label: string }> =
  [
    { value: "draft", label: "Rascunho" },
    { value: "em_edicao", label: "Em edição" },
    { value: "em_revisao", label: "Em revisão" },
    { value: "finalizado", label: "Finalizado" },
  ];

export const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  finalizado: {
    label: "Finalizado",
    className: "bg-success/15 text-success border-success/30",
  },
  em_edicao: {
    label: "Em edição",
    className: "bg-pending/15 text-pending border-pending/30",
  },
  em_revisao: {
    label: "Em revisão",
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
    label: "Concluído",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
    iconName: "check-circle-2",
  },
  em_edicao: {
    label: "Em edição",
    className: "bg-pending/15 text-pending border-pending/30",
    icon: Clock3,
    iconName: "clock-3",
  },
  pendente: {
    label: "Não gerado",
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
  label: "Em edição",
  className: statusConfig.em_edicao.className,
};

export function getDefaultProcessesFilters(searchParams: URLSearchParams): ProcessesFilters {
  const page = Number(searchParams.get("page") ?? "1");
  const status = searchParams.get("status");
  const procurementMethod = searchParams.get("procurementMethod") ?? searchParams.get("type");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParams.get("search") ?? "",
    status: isProcessStatus(status) ? status : "todos",
    procurementMethod:
      procurementMethod && procurementMethod.length > 0 ? procurementMethod : "todos",
  };
}

export function getProcessesQueryParams(filters: ProcessesFilters): ProcessesListQueryParams {
  return {
    page: filters.page,
    pageSize: PROCESSES_PAGE_SIZE,
    search: filters.search.trim() || undefined,
    status: filters.status === "todos" ? undefined : filters.status,
    procurementMethod:
      filters.procurementMethod === "todos" ? undefined : filters.procurementMethod,
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

  if (filters.procurementMethod !== "todos") {
    searchParams.set("procurementMethod", filters.procurementMethod);
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
    return "Não informado";
  }

  return formatProcessListDate(dateString);
}

function cleanProcessTitleText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function capitalizeFirstLetter(value: string) {
  const [first = "", ...rest] = Array.from(value);

  return `${first.toLocaleUpperCase("pt-BR")}${rest.join("")}`;
}

function truncateAtWordBoundary(value: string, maxLength = 90) {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const next = lastSpace >= 40 ? truncated.slice(0, lastSpace) : value.slice(0, maxLength);

  return `${next.trimEnd()}...`;
}

function removeTitleBoilerplate(value: string) {
  return value
    .replace(
      /^(?:contrata[cç][aã]o|aquisi[cç][aã]o)\s+(?:de\s+)?(?:empresa\s+especializada\s+para\s+)?/i,
      "",
    )
    .replace(/^presta[cç][aã]o\s+de\s+servi[cç]os\s+para\s+/i, "Serviços para ")
    .trim();
}

function cutAtNaturalTitleBoundary(value: string) {
  const commaIndex = value.indexOf(",");

  if (commaIndex >= 20) {
    return value.slice(0, commaIndex).trim();
  }

  const patterns = [
    /\s*,\s*para\s+/i,
    /\s*,\s*junt[oa]s?\s+/i,
    /\s*,\s*que\s+/i,
    /\s*,\s*/i,
    /\s+junto\s+aos?\s+/i,
    /\s+junto\s+[àa]s?\s+/i,
    /\s+que\s+ser[aá]\s+/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (typeof match?.index === "number" && match.index >= 20) {
      return value.slice(0, match.index).trim();
    }
  }

  return value;
}

export function deriveProcessTitlePreview({
  itemDescription,
  object,
  processNumber,
  title,
}: {
  itemDescription?: string | null;
  object?: string | null;
  processNumber?: string | null;
  title?: string | null;
}) {
  const explicitTitle = title?.trim();

  if (explicitTitle) {
    return truncateAtWordBoundary(explicitTitle);
  }

  const source = itemDescription?.trim() || object?.trim() || processNumber?.trim() || "Processo";
  const normalized = cleanProcessTitleText(
    cutAtNaturalTitleBoundary(removeTitleBoilerplate(source)),
  );

  return truncateAtWordBoundary(capitalizeFirstLetter(normalized || source));
}

export function getProcessDisplayName(
  process: Pick<ProcessesListItem, "object"> & { title?: string | null; processNumber?: string },
) {
  return deriveProcessTitlePreview({
    title: process.title,
    object: process.object,
    processNumber: process.processNumber,
  });
}

export function getProcessDetailDisplayName(
  process: Pick<ProcessDetailResponse, "object" | "processNumber"> & { title?: string | null },
) {
  return deriveProcessTitlePreview({
    title: process.title,
    object: process.object,
    processNumber: process.processNumber,
  });
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
    return "Não informado";
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

function normalizeTextValue(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.replace(/\s+/g, " ").trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function firstTextValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = normalizeTextValue(record[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeProcessDetailItemComponent(
  value: unknown,
  index: number,
): ProcessDetailSourceItemComponent | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = firstTextValue(value, ["title", "name", "description", "itemDescription"]);
  const description = firstTextValue(value, ["description", "itemDescription", "details"]);

  if (!title && !description) {
    return null;
  }

  const explicitId = firstTextValue(value, ["id", "code"]);

  return {
    id: explicitId ? `component-${index}-${explicitId}` : `component-${index}`,
    title: title ?? description ?? `Componente ${index + 1}`,
    description: description === title ? null : description,
    quantity: firstTextValue(value, ["quantity", "amount", "qty"]),
    unit: firstTextValue(value, ["unit", "measureUnit", "unitOfMeasure"]),
  };
}

function getComponentCandidates(record: Record<string, unknown>) {
  for (const key of ["components", "subitems", "subItems", "children"]) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeProcessDetailItem(value: unknown, index: number): ProcessDetailSourceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = firstTextValue(value, ["title", "name", "description", "itemDescription"]);
  const description = firstTextValue(value, ["description", "itemDescription", "details"]);

  if (!title && !description) {
    return null;
  }

  const explicitId = firstTextValue(value, ["id", "code"]);

  return {
    id: explicitId ? `item-${index}-${explicitId}` : `item-${index}`,
    code: firstTextValue(value, ["code", "itemCode"]),
    title: title ?? description ?? `Item ${index + 1}`,
    description: description === title ? null : description,
    quantity: firstTextValue(value, ["quantity", "amount", "qty"]),
    unit: firstTextValue(value, ["unit", "measureUnit", "unitOfMeasure"]),
    unitValue: firstTextValue(value, ["unitValue", "unitPrice", "price"]),
    totalValue: firstTextValue(value, ["totalValue", "total", "estimatedValue"]),
    components: getComponentCandidates(value)
      .map((component, componentIndex) =>
        normalizeProcessDetailItemComponent(component, componentIndex),
      )
      .filter((component): component is ProcessDetailSourceItemComponent => component !== null),
  };
}

export function getProcessDetailItems(
  process: Pick<ProcessDetailResponse, "items"> | { items?: ProcessDetailResponse["items"] },
): ProcessDetailSourceItem[] {
  return (process.items ?? [])
    .map((item, index) => normalizeProcessDetailItem(item, index))
    .filter((item): item is ProcessDetailSourceItem => item !== null);
}

export function getProcessDetailDocumentStatusConfig(status: ProcessDetailDocumentStatus) {
  return processDetailDocumentStatusConfig[status];
}

export function getProcessDetailDocumentActionLinks(
  processId: string,
  document: Pick<ProcessDetailDocument, "type" | "documentId" | "availableActions">,
) {
  const encodedType = encodeURIComponent(document.type);
  const generationHref = `/app/documento/novo?tipo=${encodedType}&processo=${processId}`;

  return {
    createHref: document.availableActions.create ? generationHref : null,
    regenerateHref: document.documentId ? generationHref : null,
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
    title: "",
    object: "",
    justification: "",
    responsibleName: "",
    status: "draft",
    organizationId: actor.role === "admin" ? "" : (actor.organizationId ?? ""),
    departmentIds: [],
    sourceKind: null,
    sourceReference: null,
    sourceMetadata: null,
    expenseRequestItems: [],
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
    errors.organizationId = "Selecione a organização.";
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

  if (!values.title.trim()) {
    errors.title = "Informe o titulo.";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNullableItemText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

export function createEmptyExpenseRequestFormItem({
  kind = "simple",
  source = "manual",
}: {
  kind?: ExpenseRequestFormItemKind;
  source?: ExpenseRequestFormItem["source"];
} = {}): ExpenseRequestFormItem {
  return {
    id: crypto.randomUUID(),
    kind,
    code: "",
    title: "",
    description: "",
    quantity: "",
    unit: "",
    unitValue: "",
    totalValue: "",
    components: [],
    source,
  };
}

export function createEmptyExpenseRequestComponent(): ExpenseRequestFormItemComponent {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    quantity: "",
    unit: "",
  };
}

export function setExpenseRequestItemKind(
  item: ExpenseRequestFormItem,
  kind: ExpenseRequestFormItemKind,
) {
  return {
    ...item,
    kind,
    components: kind === "kit" ? item.components : [],
  };
}

export function updateExpenseRequestFormItemField<
  Field extends keyof Omit<ExpenseRequestFormItem, "id" | "source" | "components">,
>(item: ExpenseRequestFormItem, field: Field, value: ExpenseRequestFormItem[Field]) {
  const nextItem = {
    ...item,
    [field]: value,
  };

  return field === "kind"
    ? setExpenseRequestItemKind(nextItem, value as ExpenseRequestFormItemKind)
    : nextItem;
}

export function addExpenseRequestComponentToItem(item: ExpenseRequestFormItem) {
  return item.kind === "kit"
    ? {
        ...item,
        components: [...item.components, createEmptyExpenseRequestComponent()],
      }
    : item;
}

export function updateExpenseRequestComponentField<
  Field extends keyof Omit<ExpenseRequestFormItemComponent, "id">,
>(
  item: ExpenseRequestFormItem,
  componentId: string,
  field: Field,
  value: ExpenseRequestFormItemComponent[Field],
) {
  return {
    ...item,
    components: item.components.map((component) =>
      component.id === componentId ? { ...component, [field]: value } : component,
    ),
  };
}

export function removeExpenseRequestComponentFromItem(
  item: ExpenseRequestFormItem,
  componentId: string,
) {
  return {
    ...item,
    components: item.components.filter((component) => component.id !== componentId),
  };
}

function parseLocalizedNumber(value: string) {
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateExpenseRequestItemTotalValue(
  quantity: string,
  unitValue: string,
): string | null {
  const parsedQuantity = parseLocalizedNumber(quantity);
  const parsedUnitValue = parseLocalizedNumber(unitValue);

  if (parsedQuantity === null || parsedUnitValue === null) {
    return null;
  }

  return (parsedQuantity * parsedUnitValue).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getExpenseRequestItemTotalPreview(item: ExpenseRequestFormItem) {
  return (
    item.totalValue.trim() || calculateExpenseRequestItemTotalValue(item.quantity, item.unitValue)
  );
}

export function toExpenseRequestFormItems(
  items: ExpenseRequestExtractionItem[] | undefined,
  source: ExpenseRequestFormItem["source"] = "pdf",
): ExpenseRequestFormItem[] {
  return (items ?? [])
    .filter((item) =>
      Boolean(
        item.code?.trim() ||
          item.title?.trim() ||
          item.description?.trim() ||
          item.quantity?.trim() ||
          item.unit?.trim() ||
          item.unitValue?.trim() ||
          item.totalValue?.trim(),
      ),
    )
    .map((item) => ({
      id: crypto.randomUUID(),
      kind: "simple" as const,
      code: item.code ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
      quantity: item.quantity ?? "",
      unit: item.unit ?? "",
      unitValue: item.unitValue ?? "",
      totalValue: item.totalValue ?? "",
      components: [],
      source,
    }));
}

function normalizeExpenseRequestComponentsForMetadata(
  components: ExpenseRequestFormItemComponent[],
) {
  return components
    .map((component) => ({
      title: normalizeNullableItemText(component.title),
      description: normalizeNullableItemText(component.description),
      quantity: normalizeNullableItemText(component.quantity),
      unit: normalizeNullableItemText(component.unit),
    }))
    .filter((component) =>
      Boolean(component.title || component.description || component.quantity || component.unit),
    );
}

export function normalizeExpenseRequestItemsForMetadata(items: ExpenseRequestFormItem[]) {
  return items
    .map((item) => {
      const components =
        item.kind === "kit" ? normalizeExpenseRequestComponentsForMetadata(item.components) : [];

      return {
        kind: item.kind,
        code: normalizeNullableItemText(item.code),
        title: normalizeNullableItemText(item.title),
        description: normalizeNullableItemText(item.description),
        quantity: normalizeNullableItemText(item.quantity),
        unit: normalizeNullableItemText(item.unit),
        unitValue: normalizeNullableItemText(item.unitValue),
        totalValue:
          normalizeNullableItemText(item.totalValue) ??
          calculateExpenseRequestItemTotalValue(item.quantity, item.unitValue),
        components,
      };
    })
    .filter((item) =>
      Boolean(
        item.code ||
          item.title ||
          item.description ||
          item.quantity ||
          item.unit ||
          item.unitValue ||
          item.totalValue ||
          item.components.length > 0,
      ),
    );
}

export function buildProcessCreateRequest(
  values: ProcessCreationFormValues,
  actor: ProcessCreationActor,
): ProcessCreateRequest {
  return {
    procurementMethod: values.type.trim() || null,
    biddingModality: null,
    processNumber: values.processNumber.trim(),
    externalId: values.externalId.trim() || null,
    issuedAt: new Date(values.issuedAt).toISOString(),
    title: values.title.trim(),
    object: values.object.trim(),
    justification: values.justification.trim(),
    responsibleName: values.responsibleName.trim(),
    status: values.status,
    departmentIds: values.departmentIds,
    ...(actor.role === "admin" || values.organizationId !== actor.organizationId
      ? { organizationId: values.organizationId }
      : {}),
    items: normalizeExpenseRequestItemsForMetadata(values.expenseRequestItems).map((item) =>
      item.kind === "kit"
        ? {
            kind: "kit",
            code: item.code ?? "",
            title: item.title ?? item.description ?? "",
            quantity: item.quantity,
            unit: item.unit ?? "un",
            unitValue: item.unitValue,
            totalValue: item.totalValue,
            components: item.components.map((component) => ({
              title: component.title ?? "",
              description: component.description,
              quantity: component.quantity,
              unit: component.unit ?? "un",
            })),
          }
        : {
            kind: "simple",
            code: item.code ?? "",
            title: item.title ?? item.description ?? "",
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? "un",
            unitValue: item.unitValue,
            totalValue: item.totalValue,
          },
    ),
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

  return "Não foi possível criar o processo.";
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

  return "Não foi possível carregar o processo.";
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

    if (
      key === "type" &&
      typeof value === "string" &&
      !processTypeOptions.some((option) => option.value === value)
    ) {
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
