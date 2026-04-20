import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { isActorInSameOrganization, type StoredUser } from "./users.shared";

export function canListUsers(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list users.");
}

export function canReadUser(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read users.");
}

export function canReadStoredUser(actor: Actor, targetUser: Pick<StoredUser, "organizationId">) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && isActorInSameOrganization(actor, targetUser)) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this user.");
}

export function canManageStoredUser(
  actor: Actor,
  targetUser: Pick<StoredUser, "organizationId" | "role">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    actor.role === "organization_owner" &&
    isActorInSameOrganization(actor, targetUser) &&
    targetUser.role === "member"
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to manage this user.");
}

export function canUpdateStoredUser(
  actor: Actor,
  targetUser: Pick<StoredUser, "organizationId" | "role">,
) {
  return canManageStoredUser(actor, targetUser);
}

export function canDeleteStoredUser(
  actor: Actor,
  targetUser: Pick<StoredUser, "organizationId" | "role">,
) {
  return canManageStoredUser(actor, targetUser);
}

export type UserUpdateInput = {
  name?: string;
  role?: Actor["role"];
  organizationId?: string | null;
};

export function validateUserUpdate(
  actor: Actor,
  targetUser: Pick<StoredUser, "organizationId" | "role">,
  input: UserUpdateInput,
) {
  canUpdateStoredUser(actor, targetUser);

  const nextRole = input.role ?? targetUser.role;
  const nextOrganizationId =
    "organizationId" in input ? input.organizationId : targetUser.organizationId;
  const changesRoleOrOrganization = input.role !== undefined || "organizationId" in input;

  if (actor.role === "organization_owner") {
    if (nextRole !== "member") {
      throw new ForbiddenError("Organization owners can only keep managed users as members.");
    }

    if (nextOrganizationId !== actor.organizationId) {
      throw new ForbiddenError(
        "Organization owners can only manage members from their own organization.",
      );
    }
  }

  if (changesRoleOrOrganization) {
    if (nextRole === "admin" && nextOrganizationId !== null) {
      throw new BadRequestError("Admin users cannot belong to an organization.");
    }

    if (nextRole !== "admin" && nextOrganizationId === null) {
      throw new BadRequestError("Organization owners and members must belong to an organization.");
    }
  }
}
