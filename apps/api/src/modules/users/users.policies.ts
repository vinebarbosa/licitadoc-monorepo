import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";

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
