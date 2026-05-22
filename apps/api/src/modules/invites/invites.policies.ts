import type { Actor } from "../../authorization/actor";
import type { invites } from "../../db";
import { ForbiddenError } from "../../shared/errors/forbidden-error";

type StoredInvite = typeof invites.$inferSelect;

export function getInviteRoleForActor(actor: Actor) {
  if (actor.role === "admin") {
    return "organization_owner" as const;
  }

  if (actor.role === "organization_owner") {
    return "member" as const;
  }

  throw new ForbiddenError("You do not have permission to create invites.");
}

export function canListInvites(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list invites.");
}

export function canManageStoredInvite(actor: Actor, invite: Pick<StoredInvite, "organizationId">) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    actor.role === "organization_owner" &&
    actor.organizationId !== null &&
    actor.organizationId === invite.organizationId
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to manage this invite.");
}
