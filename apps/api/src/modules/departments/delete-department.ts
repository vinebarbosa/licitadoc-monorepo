import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canDeleteStoredDepartment } from "./departments.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  departmentId: string;
};

export async function deleteDepartment({ actor, db, departmentId }: Input) {
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
  });

  if (!department) {
    throw new NotFoundError("Department not found.");
  }

  canDeleteStoredDepartment(actor, department);

  const [deletedDepartment] = await db
    .delete(departments)
    .where(eq(departments.id, departmentId))
    .returning({
      id: departments.id,
    });

  if (!deletedDepartment) {
    throw new NotFoundError("Department not found.");
  }

  return {
    success: true as const,
  };
}
