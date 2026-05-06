import { Building2, Shield, ShieldCheck, User } from "lucide-react";
import type {
  AdminInviteCreateRequest,
  AdminOrganizationsListResponse,
  AdminUsersListResponse,
  AdminUserUpdateRequest,
} from "../api/admin-users";

export type AdminUsersListItem = AdminUsersListResponse["items"][number];
export type AdminOrganizationListItem = AdminOrganizationsListResponse["items"][number];
export type AdminUserRole = AdminUsersListItem["role"];

export type AdminUsersFilters = {
  page: number;
  search: string;
  role: AdminUserRole | "all";
  organizationId: string | "all";
};

export type AdminUserFormValues = {
  name: string;
  role: AdminUserRole;
  organizationId: string | "none";
};

export type CreateInviteFormValues = {
  email: string;
  organizationId: string | "none";
};

export const USERS_PAGE_SIZE = 10;

export const roleOptions: Array<{ value: AdminUserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "organization_owner", label: "Admin Org." },
  { value: "member", label: "Usuário" },
];

export const roleConfig: Record<
  AdminUserRole,
  {
    label: string;
    className: string;
    icon: typeof ShieldCheck;
  }
> = {
  admin: {
    label: "Admin",
    className: "bg-critical/15 text-critical border-critical/30",
    icon: ShieldCheck,
  },
  organization_owner: {
    label: "Admin Org.",
    className: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    icon: Shield,
  },
  member: {
    label: "Usuário",
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    icon: User,
  },
};

export const statsCardConfig = [
  {
    key: "total",
    label: "Total de Usuários",
    icon: User,
    iconClassName: "bg-muted text-muted-foreground",
  },
  {
    key: "admin",
    label: "Admins",
    icon: ShieldCheck,
    iconClassName: "bg-critical/20 text-critical",
  },
  {
    key: "organization_owner",
    label: "Admins de Org.",
    icon: Shield,
    iconClassName: "bg-chart-1/20 text-chart-1",
  },
  {
    key: "member",
    label: "Usuários Comuns",
    icon: Building2,
    iconClassName: "bg-muted text-muted-foreground",
  },
] as const;

export function getDefaultAdminUsersFilters(searchParams: URLSearchParams): AdminUsersFilters {
  const page = Number(searchParams.get("page") ?? "1");
  const role = searchParams.get("role");
  const organizationId = searchParams.get("organizationId");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParams.get("search") ?? "",
    role: isAdminUserRole(role) ? role : "all",
    organizationId: organizationId && organizationId.length > 0 ? organizationId : "all",
  };
}

export function getUsersQueryParams(filters: AdminUsersFilters) {
  return {
    page: filters.page,
    pageSize: USERS_PAGE_SIZE,
    search: filters.search || undefined,
    role: filters.role === "all" ? undefined : filters.role,
    organizationId: filters.organizationId === "all" ? undefined : filters.organizationId,
  };
}

export function getFilterSearchParams(filters: AdminUsersFilters) {
  const searchParams = new URLSearchParams();

  if (filters.page > 1) {
    searchParams.set("page", String(filters.page));
  }

  if (filters.search.trim().length > 0) {
    searchParams.set("search", filters.search.trim());
  }

  if (filters.role !== "all") {
    searchParams.set("role", filters.role);
  }

  if (filters.organizationId !== "all") {
    searchParams.set("organizationId", filters.organizationId);
  }

  return searchParams;
}

export function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() ?? "US";
}

export function formatCreatedAt(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getUserStats(users: AdminUsersListItem[]) {
  return {
    total: users.length,
    admin: users.filter((user) => user.role === "admin").length,
    organization_owner: users.filter((user) => user.role === "organization_owner").length,
    member: users.filter((user) => user.role === "member").length,
  };
}

export function getOrganizationName(
  user: AdminUsersListItem,
  organizations: AdminOrganizationListItem[],
) {
  if (!user.organizationId) {
    return "Sem organização";
  }

  return organizations.find((organization) => organization.id === user.organizationId)?.name ?? "";
}

export function toAdminUserFormValues(user: AdminUsersListItem): AdminUserFormValues {
  return {
    name: user.name,
    role: user.role,
    organizationId: user.organizationId ?? "none",
  };
}

export function toUpdateUserPayload(values: AdminUserFormValues): AdminUserUpdateRequest {
  return {
    name: values.name.trim(),
    role: values.role,
    organizationId: values.organizationId === "none" ? null : values.organizationId,
  };
}

export function toInvitePayload(values: CreateInviteFormValues): AdminInviteCreateRequest {
  return {
    email: values.email.trim(),
    organizationId: values.organizationId === "none" ? null : values.organizationId,
  };
}

function isAdminUserRole(value: string | null): value is AdminUserRole {
  return value === "admin" || value === "organization_owner" || value === "member";
}
