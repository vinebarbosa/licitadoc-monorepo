import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { processDepartments, processes } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canUpdateStoredProcess } from "./processes.policies";
import type { UpdateProcessInput } from "./processes.schemas";
import {
  assertDepartmentIdsBelongToOrganization,
  deriveConciseProcessTitle,
  getProcessDepartmentIds,
  serializeProcess,
  throwIfProcessConflict,
} from "./processes.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  processId: string;
  changes: UpdateProcessInput;
};

export async function updateProcess({ actor, db, processId, changes }: Input) {
  const process = await db.query.processes.findFirst({
    where: (table, { eq: equals }) => equals(table.id, processId),
  });

  if (!process) {
    throw new NotFoundError("Process not found.");
  }

  canUpdateStoredProcess(actor, process);

  if (changes.departmentIds !== undefined) {
    await assertDepartmentIdsBelongToOrganization({
      db,
      organizationId: process.organizationId,
      departmentIds: changes.departmentIds,
    });
  }

  return db.transaction(async (tx) => {
    let updatedProcess: typeof processes.$inferSelect | undefined;

    try {
      [updatedProcess] = await tx
        .update(processes)
        .set({
          type: changes.type,
          processNumber: changes.processNumber,
          externalId: changes.externalId,
          issuedAt: changes.issuedAt ? new Date(changes.issuedAt) : undefined,
          title:
            changes.title === undefined
              ? undefined
              : deriveConciseProcessTitle({
                  title: changes.title,
                  object: changes.object ?? process.object,
                  processNumber: changes.processNumber ?? process.processNumber,
                }),
          object: changes.object,
          justification: changes.justification,
          responsibleName: changes.responsibleName,
          status: changes.status,
          updatedAt: new Date(),
        })
        .where(eq(processes.id, processId))
        .returning();
    } catch (error) {
      throwIfProcessConflict(error);
    }

    if (!updatedProcess) {
      throw new NotFoundError("Process not found.");
    }

    if (changes.departmentIds !== undefined) {
      await tx.delete(processDepartments).where(eq(processDepartments.processId, processId));
      await tx.insert(processDepartments).values(
        changes.departmentIds.map((departmentId) => ({
          processId,
          departmentId,
        })),
      );

      return serializeProcess(updatedProcess, changes.departmentIds);
    }

    const currentDepartmentIds = await getProcessDepartmentIds({
      db: tx,
      processId,
    });

    return serializeProcess(updatedProcess, currentDepartmentIds);
  });
}
