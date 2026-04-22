import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import type { StoredDocument } from "./documents.shared";

export function canManageDocument(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    (actor.role === "organization_owner" || actor.role === "member") &&
    actor.organizationId === organizationId
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to manage this document.");
}

export function canListDocuments(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner" || actor.role === "member") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list documents.");
}

export function canReadStoredDocument(
  actor: Actor,
  document: Pick<StoredDocument, "organizationId">,
) {
  return canManageDocument(actor, document.organizationId);
}
