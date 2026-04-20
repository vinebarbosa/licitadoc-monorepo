import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";

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
