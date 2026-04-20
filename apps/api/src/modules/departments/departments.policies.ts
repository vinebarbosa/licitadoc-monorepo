import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { isActorInDepartmentOrganization, type StoredDepartment } from "./departments.shared";

type ActorScope = Pick<Actor, "role" | "organizationId">;

export function resolveDepartmentOrganizationIdForCreate(
  actor: ActorScope,
  inputOrganizationId?: string,
) {
  if (actor.role === "admin") {
    if (!inputOrganizationId) {
      throw new BadRequestError("Organization id is required.");
    }

    return inputOrganizationId;
  }

  if (actor.role !== "organization_owner") {
    throw new ForbiddenError("You do not have permission to create departments.");
  }

  if (actor.organizationId === null) {
    throw new BadRequestError("You do not belong to an organization.");
  }

  if (inputOrganizationId && inputOrganizationId !== actor.organizationId) {
    throw new ForbiddenError("You cannot create departments outside your organization.");
  }

  return actor.organizationId;
}

export function canListDepartments(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner" || actor.role === "member") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list departments.");
}

export function canReadStoredDepartment(
  actor: Actor,
  department: Pick<StoredDepartment, "organizationId">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && isActorInDepartmentOrganization(actor, department)) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this department.");
}

export function canUpdateStoredDepartment(
  actor: Actor,
  department: Pick<StoredDepartment, "organizationId">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (actor.role === "organization_owner" && isActorInDepartmentOrganization(actor, department)) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to update this department.");
}
