import type {
  OwnerDepartmentCreateRequest,
  OwnerDepartmentListItem,
  OwnerDepartmentsListResponse,
} from "../api/owner-departments";

export type OwnerDepartmentCreateFormValues = {
  name: string;
  slug: string;
  budgetUnitCode: string;
  responsibleName: string;
  responsibleRole: string;
};

export function getDefaultOwnerDepartmentCreateFormValues(): OwnerDepartmentCreateFormValues {
  return {
    name: "",
    slug: "",
    budgetUnitCode: "",
    responsibleName: "",
    responsibleRole: "",
  };
}

export function createDepartmentSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toOwnerDepartmentCreatePayload(
  values: OwnerDepartmentCreateFormValues,
): OwnerDepartmentCreateRequest {
  const budgetUnitCode = values.budgetUnitCode.trim();

  return {
    name: values.name.trim(),
    slug: createDepartmentSlug(values.slug),
    budgetUnitCode: budgetUnitCode.length > 0 ? budgetUnitCode : null,
    responsibleName: values.responsibleName.trim(),
    responsibleRole: values.responsibleRole.trim(),
  };
}

export function isOwnerDepartmentCreateFormSubmittable(values: OwnerDepartmentCreateFormValues) {
  return (
    values.name.trim().length > 0 &&
    values.slug.trim().length > 0 &&
    values.responsibleName.trim().length > 0 &&
    values.responsibleRole.trim().length > 0
  );
}

export function isOwnerDepartmentCreateSuccessResponse(
  response: unknown,
): response is OwnerDepartmentListItem {
  if (!response || typeof response !== "object") {
    return false;
  }

  const candidate = response as Partial<OwnerDepartmentListItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.responsibleName === "string" &&
    typeof candidate.responsibleRole === "string"
  );
}

export function isOwnerDepartmentsListSuccessResponse(
  response: unknown,
): response is OwnerDepartmentsListResponse {
  if (!response || typeof response !== "object") {
    return false;
  }

  const candidate = response as Partial<OwnerDepartmentsListResponse>;

  return (
    Array.isArray(candidate.items) &&
    typeof candidate.page === "number" &&
    typeof candidate.pageSize === "number" &&
    typeof candidate.total === "number" &&
    typeof candidate.totalPages === "number"
  );
}

export function getDepartmentBudgetUnitLabel(
  department: Pick<OwnerDepartmentListItem, "budgetUnitCode">,
) {
  return department.budgetUnitCode?.trim() || "Sem unidade";
}

function readMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = (value as { message?: unknown }).message;

  return typeof message === "string" && message.trim().length > 0 ? message : null;
}

export function getOwnerDepartmentErrorMessage(
  response: unknown,
  fallback = "Não foi possível criar o departamento.",
) {
  const directMessage = readMessage(response);

  if (directMessage) {
    return directMessage;
  }

  if (response && typeof response === "object") {
    const dataMessage = readMessage((response as { data?: unknown }).data);

    if (dataMessage) {
      return dataMessage;
    }
  }

  return fallback;
}
