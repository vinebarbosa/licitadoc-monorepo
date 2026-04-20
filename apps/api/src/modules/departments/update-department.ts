import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canUpdateStoredDepartment } from "./departments.policies";
import type { UpdateDepartmentInput } from "./departments.schemas";
import { serializeDepartment, throwIfDepartmentConflict } from "./departments.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  departmentId: string;
  changes: UpdateDepartmentInput;
};

export async function updateDepartment({ actor, db, departmentId, changes }: Input) {
  const department = await db.query.departments.findFirst({
    where: (table, { eq: equals }) => equals(table.id, departmentId),
  });

  if (!department) {
    throw new NotFoundError("Department not found.");
  }

  canUpdateStoredDepartment(actor, department);

  let updatedDepartment: typeof departments.$inferSelect | undefined;

  try {
    [updatedDepartment] = await db
      .update(departments)
      .set({
        ...changes,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, departmentId))
      .returning();
  } catch (error) {
    throwIfDepartmentConflict(error);
  }

  if (!updatedDepartment) {
    throw new NotFoundError("Department not found.");
  }

  return serializeDepartment(updatedDepartment);
}
