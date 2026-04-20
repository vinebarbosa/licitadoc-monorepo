import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { isActorInProcessOrganization, type StoredProcess } from "./processes.shared";

type ActorScope = Pick<Actor, "role" | "organizationId">;

export function resolveProcessOrganizationIdForCreate(
  actor: ActorScope,
  inputOrganizationId?: string,
) {
  if (actor.role === "admin") {
    if (!inputOrganizationId) {
      throw new BadRequestError("Organization id is required.");
    }

    return inputOrganizationId;
  }

  if (actor.role !== "organization_owner" && actor.role !== "member") {
    throw new ForbiddenError("You do not have permission to create processes.");
  }

  if (actor.organizationId === null) {
    throw new BadRequestError("You do not belong to an organization.");
  }

  if (inputOrganizationId && inputOrganizationId !== actor.organizationId) {
    throw new ForbiddenError("You cannot create processes outside your organization.");
  }

  return actor.organizationId;
}

export function canListProcesses(actor: Actor) {
  if (actor.role === "admin" || actor.role === "organization_owner" || actor.role === "member") {
    return true;
  }

  throw new ForbiddenError("You do not have permission to list processes.");
}

export function canReadStoredProcess(actor: Actor, process: Pick<StoredProcess, "organizationId">) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    (actor.role === "organization_owner" || actor.role === "member") &&
    isActorInProcessOrganization(actor, process)
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this process.");
}

export function canUpdateStoredProcess(
  actor: Actor,
  process: Pick<StoredProcess, "organizationId">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    (actor.role === "organization_owner" || actor.role === "member") &&
    isActorInProcessOrganization(actor, process)
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to update this process.");
}
