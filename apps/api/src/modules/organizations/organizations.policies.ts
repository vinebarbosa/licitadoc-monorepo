import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import type { UpdateOrganizationInput } from "./organizations.schemas";
import { isActorInOrganization, type StoredOrganization } from "./organizations.shared";

type ActorScope = Pick<Actor, "role" | "organizationId">;

export function canCreateOrganization(actor: ActorScope) {
  if (actor.role !== "organization_owner") {
    throw new ForbiddenError(
      "Only organization owners without organization can create an organization.",
    );
  }

  if (actor.organizationId !== null) {
    throw new BadRequestError("You already belong to an organization.");
  }

  return true;
}

export function canListOrganizations(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list organizations.");
}

export function canReadOrganization(actor: Actor, organizationId: string) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && actor.organizationId === organizationId) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this organization.");
}

export function canReadStoredOrganization(
  actor: Actor,
  organization: Pick<StoredOrganization, "id">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && isActorInOrganization(actor, organization)) {
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

export function canUpdateStoredOrganization(
  actor: Actor,
  organization: Pick<StoredOrganization, "id">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && isActorInOrganization(actor, organization)) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to update this organization.");
}

export function validateOrganizationUpdate(
  actor: Actor,
  organization: Pick<StoredOrganization, "id">,
  input: UpdateOrganizationInput,
) {
  canUpdateStoredOrganization(actor, organization);

  if (actor.role === "organization_owner" && input.isActive !== undefined) {
    throw new ForbiddenError("Organization owners cannot change organization status.");
  }
}
