import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { processDepartments, processes } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { resolveProcessOrganizationIdForCreate } from "./processes.policies";
import type { CreateProcessInput } from "./processes.schemas";
import {
  assertDepartmentIdsBelongToOrganization,
  serializeProcess,
  throwIfProcessConflict,
} from "./processes.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  process: CreateProcessInput;
};

export async function createProcess({ actor, db, process }: Input) {
  const organizationId = resolveProcessOrganizationIdForCreate(actor, process.organizationId);

  return db.transaction(async (tx) => {
    const organization = await tx.query.organizations.findFirst({
      where: (table, { eq }) => eq(table.id, organizationId),
    });

    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    await assertDepartmentIdsBelongToOrganization({
      db: tx,
      organizationId,
      departmentIds: process.departmentIds,
    });

    let createdProcess: typeof processes.$inferSelect | undefined;

    try {
      [createdProcess] = await tx
        .insert(processes)
        .values({
          organizationId,
          type: process.type,
          processNumber: process.processNumber,
          externalId: process.externalId,
          issuedAt: new Date(process.issuedAt),
          object: process.object,
          justification: process.justification,
          responsibleName: process.responsibleName,
          status: process.status,
          sourceKind: process.sourceKind,
          sourceReference: process.sourceReference,
          sourceMetadata: process.sourceMetadata ?? null,
        })
        .returning();
    } catch (error) {
      throwIfProcessConflict(error);
    }

    if (!createdProcess) {
      throw new NotFoundError("Process could not be created.");
    }

    await tx.insert(processDepartments).values(
      process.departmentIds.map((departmentId) => ({
        processId: createdProcess.id,
        departmentId,
      })),
    );

    return serializeProcess(createdProcess, process.departmentIds);
  });
}
