import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { resolveDepartmentOrganizationIdForCreate } from "./departments.policies";
import type { CreateDepartmentInput } from "./departments.schemas";
import { serializeDepartment, throwIfDepartmentConflict } from "./departments.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  department: CreateDepartmentInput;
};

export async function createDepartment({ actor, db, department }: Input) {
  const organizationId = resolveDepartmentOrganizationIdForCreate(actor, department.organizationId);
  const organization = await db.query.organizations.findFirst({
    where: (table, { eq }) => eq(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  let createdDepartment: typeof departments.$inferSelect | undefined;

  try {
    [createdDepartment] = await db
      .insert(departments)
      .values({
        name: department.name,
        slug: department.slug,
        budgetUnitCode: department.budgetUnitCode,
        organizationId,
        responsibleName: department.responsibleName,
        responsibleRole: department.responsibleRole,
      })
      .returning();
  } catch (error) {
    throwIfDepartmentConflict(error);
  }

  if (!createdDepartment) {
    throw new NotFoundError("Department could not be created.");
  }

  return serializeDepartment(createdDepartment);
}
