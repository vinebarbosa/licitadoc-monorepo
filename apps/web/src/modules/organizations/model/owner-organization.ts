import type {
  OwnerOrganizationDepartment,
  OwnerOrganizationDepartmentCreateRequest,
  OwnerOrganizationDepartmentUpdateRequest,
  OwnerOrganizationInvite,
  OwnerOrganizationMember,
  OwnerOrganizationProfile,
  OwnerOrganizationUpdateRequest,
} from "../api/owner-organization";

export type OwnerOrganizationFormValues = {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  cidade: string;
  uf: string;
  endereco: string;
  cep: string;
  telefone: string;
  emailInstitucional: string;
  site: string;
  autoridadeMaxima: string;
  cargoAutoridadeMaxima: string;
};

export type OwnerOrganizationDepartmentFormValues = {
  nome: string;
  slug: string;
  unidadeOrcamentaria: string;
  responsavelNome: string;
  responsavelCargo: string;
};

export type OwnerOrganizationMemberRole = OwnerOrganizationMember["role"];
export type OwnerOrganizationInviteStatus = "expirado" | "pendente";

export const OWNER_ORGANIZATION_ROLE_LABELS: Record<OwnerOrganizationMemberRole, string> = {
  admin: "Administrador",
  member: "Membro",
  organization_owner: "Gestor da Organização",
};

export const OWNER_ORGANIZATION_ROLE_COLORS: Record<OwnerOrganizationMemberRole, string> = {
  admin: "border-border bg-muted text-muted-foreground",
  member: "border-primary/20 bg-primary/10 text-primary",
  organization_owner: "border-success/20 bg-success/10 text-success",
};

export function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function slugifyOrganizationValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toOwnerOrganizationFormValues(
  organization: OwnerOrganizationProfile,
): OwnerOrganizationFormValues {
  return {
    nomeFantasia: organization.name,
    razaoSocial: organization.officialName,
    cnpj: formatCNPJ(organization.cnpj),
    cidade: organization.city,
    uf: organization.state,
    endereco: organization.address,
    cep: formatCEP(organization.zipCode),
    telefone: formatPhone(organization.phone),
    emailInstitucional: organization.institutionalEmail,
    site: organization.website ?? "",
    autoridadeMaxima: organization.authorityName,
    cargoAutoridadeMaxima: organization.authorityRole,
  };
}

export function toOwnerOrganizationUpdatePayload(
  values: OwnerOrganizationFormValues,
): OwnerOrganizationUpdateRequest {
  return {
    name: values.nomeFantasia.trim(),
    officialName: values.razaoSocial.trim(),
    cnpj: values.cnpj.trim(),
    city: values.cidade.trim(),
    state: values.uf.trim().toUpperCase(),
    address: values.endereco.trim(),
    zipCode: values.cep.trim(),
    phone: values.telefone.trim(),
    institutionalEmail: values.emailInstitucional.trim().toLowerCase(),
    website: values.site.trim() || null,
    authorityName: values.autoridadeMaxima.trim(),
    authorityRole: values.cargoAutoridadeMaxima.trim(),
  };
}

export function getOwnerOrganizationEmptyDepartmentForm(): OwnerOrganizationDepartmentFormValues {
  return {
    nome: "",
    slug: "",
    unidadeOrcamentaria: "",
    responsavelNome: "",
    responsavelCargo: "",
  };
}

export function toOwnerOrganizationDepartmentFormValues(
  department: OwnerOrganizationDepartment,
): OwnerOrganizationDepartmentFormValues {
  return {
    nome: department.name,
    slug: department.slug,
    unidadeOrcamentaria: department.budgetUnitCode ?? "",
    responsavelNome: department.responsibleName,
    responsavelCargo: department.responsibleRole,
  };
}

export function toOwnerOrganizationDepartmentCreatePayload(
  values: OwnerOrganizationDepartmentFormValues,
  organizationId?: string,
): OwnerOrganizationDepartmentCreateRequest {
  const budgetUnitCode = values.unidadeOrcamentaria.trim();

  return {
    name: values.nome.trim(),
    slug: slugifyOrganizationValue(values.slug),
    budgetUnitCode: budgetUnitCode.length > 0 ? budgetUnitCode : null,
    organizationId,
    responsibleName: values.responsavelNome.trim(),
    responsibleRole: values.responsavelCargo.trim(),
  };
}

export function toOwnerOrganizationDepartmentUpdatePayload(
  values: OwnerOrganizationDepartmentFormValues,
): OwnerOrganizationDepartmentUpdateRequest {
  const budgetUnitCode = values.unidadeOrcamentaria.trim();

  return {
    name: values.nome.trim(),
    slug: slugifyOrganizationValue(values.slug),
    budgetUnitCode: budgetUnitCode.length > 0 ? budgetUnitCode : null,
    responsibleName: values.responsavelNome.trim(),
    responsibleRole: values.responsavelCargo.trim(),
  };
}

export function getOwnerOrganizationInviteStatus(
  invite: OwnerOrganizationInvite,
): OwnerOrganizationInviteStatus {
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return "expirado";
  }

  return "pendente";
}

export function isOwnerOrganizationVisibleInvite(invite: OwnerOrganizationInvite) {
  return invite.status === "pending";
}

export function isOwnerOrganizationPendingInvite(invite: OwnerOrganizationInvite) {
  return (
    isOwnerOrganizationVisibleInvite(invite) &&
    getOwnerOrganizationInviteStatus(invite) === "pendente"
  );
}

export function isOwnerOrganizationActiveMember(member: OwnerOrganizationMember) {
  return member.onboardingStatus === "complete";
}

export function getOwnerOrganizationUserInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "LD";
}

function readMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = (value as { message?: unknown }).message;

  return typeof message === "string" && message.trim().length > 0 ? message : null;
}

export function getOwnerOrganizationErrorMessage(
  response: unknown,
  fallback = "Não foi possível concluir a ação.",
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
