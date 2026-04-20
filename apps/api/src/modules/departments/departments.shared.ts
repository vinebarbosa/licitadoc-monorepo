import { eq, type SQL } from "drizzle-orm";
import type { Actor } from "../../authorization/actor";
import { departments } from "../../db";
import { ConflictError } from "../../shared/errors/conflict-error";

export type StoredDepartment = typeof departments.$inferSelect;

export function isActorInDepartmentOrganization(
  actor: Actor,
  department: Pick<StoredDepartment, "organizationId">,
) {
  return actor.organizationId !== null && actor.organizationId === department.organizationId;
}

export function getDepartmentsVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(departments.organizationId, actor.organizationId);
}

export function serializeDepartment(department: StoredDepartment) {
  return {
    id: department.id,
    name: department.name,
    slug: department.slug,
    organizationId: department.organizationId,
    responsibleName: department.responsibleName,
    responsibleRole: department.responsibleRole,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}

export function throwIfDepartmentConflict(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    const constraint =
      "constraint" in error && typeof error.constraint === "string" ? error.constraint : undefined;

    if (constraint === "departments_organization_slug_unique") {
      throw new ConflictError("Department slug is already in use for this organization.");
    }

    throw new ConflictError("Department conflicts with existing data.");
  }

  throw error;
}
