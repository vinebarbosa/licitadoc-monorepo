import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";

export function canManageProcess(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    (actor.role === "organization_owner" || actor.role === "member") &&
    actor.organizationId === organizationId
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to manage this process.");
}
