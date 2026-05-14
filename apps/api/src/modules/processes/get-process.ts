import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredProcess } from "./processes.policies";
import {
  getProcessDepartmentIds,
  getProcessDetailDepartments,
  getProcessDetailDocuments,
  getProcessItems,
  serializeProcessDetail,
} from "./processes.shared";

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

  const organization = await db.query.organizations.findFirst({
    where: (table, { eq }) => eq(table.id, process.organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  const departmentIds = await getProcessDepartmentIds({
    db,
    processId,
  });

  const [departments, documents, items] = await Promise.all([
    getProcessDetailDepartments({
      db,
      departmentIds,
    }),
    getProcessDetailDocuments({
      db,
      processId,
    }),
    getProcessItems({
      db,
      processId,
    }),
  ]);

  return serializeProcessDetail(process, {
    departmentIds,
    departments,
    documents,
    items,
    organization,
  });
}
