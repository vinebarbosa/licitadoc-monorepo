import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredDepartment } from "./departments.policies";
import { serializeDepartment } from "./departments.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  departmentId: string;
};

export async function getDepartment({ actor, db, departmentId }: Input) {
  const department = await db.query.departments.findFirst({
    where: (table, { eq }) => eq(table.id, departmentId),
  });

  if (!department) {
    throw new NotFoundError("Department not found.");
  }

  canReadStoredDepartment(actor, department);

  return serializeDepartment(department);
}
