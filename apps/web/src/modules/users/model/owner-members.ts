import { User } from "lucide-react";
import type {
  OwnerMemberInviteResponse,
  OwnerMemberInviteRequest,
  OwnerMembersListResponse,
  OwnerMemberUpdateRequest,
} from "../api/owner-members";

export type OwnerMembersListItem = OwnerMembersListResponse["items"][number];
export type OwnerInviteItem = OwnerMemberInviteResponse;

export type OwnerMemberEditFormValues = {
  name: string;
};

export type OwnerMemberInviteFormValues = {
  email: string;
};

export function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() ?? "US";
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toMemberUpdatePayload(values: OwnerMemberEditFormValues): OwnerMemberUpdateRequest {
  return { name: values.name.trim() };
}

export function toInvitePayload(values: OwnerMemberInviteFormValues): OwnerMemberInviteRequest {
  return { email: values.email.trim() };
}

export const memberRoleConfig = {
  label: "Usuário",
  className: "bg-muted text-muted-foreground border-muted-foreground/30",
  icon: User,
};
