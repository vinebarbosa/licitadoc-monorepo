import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";

export function canReadOrganization(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && actor.organizationId === organizationId) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this organization.");
}

export function canUpdateOrganization(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && actor.organizationId === organizationId) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to update this organization.");
}
