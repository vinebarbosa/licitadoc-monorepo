import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredProcess } from "./processes.policies";
import { getProcessDepartmentIds, serializeProcess } from "./processes.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  processId: string;
};

export async function getProcess({ actor, db, processId }: Input) {
  const process = await db.query.processes.findFirst({
    where: (table, { eq }) => eq(table.id, processId),
  });

  if (!process) {
    throw new NotFoundError("Process not found.");
  }

  canReadStoredProcess(actor, process);

  const departmentIds = await getProcessDepartmentIds({
    db,
    processId,
  });

  return serializeProcess(process, departmentIds);
}
