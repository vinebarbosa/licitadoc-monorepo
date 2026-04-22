import { and, eq, inArray, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments, processDepartments, processes } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";

export type StoredProcess = typeof processes.$inferSelect;

export function isActorInProcessOrganization(
  actor: Actor,
  process: Pick<StoredProcess, "organizationId">,
) {
  return actor.organizationId !== null && actor.organizationId === process.organizationId;
}

export function getProcessesVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(processes.organizationId, actor.organizationId);
}

export function serializeProcess(process: StoredProcess, departmentIds: string[]) {
  return {
    id: process.id,
    organizationId: process.organizationId,
    type: process.type,
    processNumber: process.processNumber,
    externalId: process.externalId ?? null,
    issuedAt: process.issuedAt.toISOString(),
    object: process.object,
    justification: process.justification,
    responsibleName: process.responsibleName,
    status: process.status,
    departmentIds,
    sourceKind: process.sourceKind ?? null,
    sourceReference: process.sourceReference ?? null,
    sourceMetadata: process.sourceMetadata ?? null,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
  };
}

export async function assertDepartmentIdsBelongToOrganization({
  db,
  organizationId,
  departmentIds,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  organizationId: string;
  departmentIds: string[];
}) {
  const rows = await db
    .select({
      id: departments.id,
    })
    .from(departments)
    .where(
      and(eq(departments.organizationId, organizationId), inArray(departments.id, departmentIds)),
    );

  if (rows.length !== departmentIds.length) {
    throw new BadRequestError("Departments must belong to the same organization as the process.");
  }
}

export async function getProcessDepartmentIds({
  db,
  processId,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  processId: string;
}) {
  const links = await db
    .select({
      departmentId: processDepartments.departmentId,
    })
    .from(processDepartments)
    .where(eq(processDepartments.processId, processId));

  return links.map((link) => link.departmentId).sort();
}

export async function getDepartmentIdsByProcessIds({
  db,
  processIds,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  processIds: string[];
}) {
  const departmentIdsByProcessId = new Map<string, string[]>();

  if (processIds.length === 0) {
    return departmentIdsByProcessId;
  }

  const links = await db
    .select({
      processId: processDepartments.processId,
      departmentId: processDepartments.departmentId,
    })
    .from(processDepartments)
    .where(inArray(processDepartments.processId, processIds));

  for (const link of links) {
    const current = departmentIdsByProcessId.get(link.processId) ?? [];
    current.push(link.departmentId);
    departmentIdsByProcessId.set(link.processId, current);
  }

  for (const [processId, departmentIds] of departmentIdsByProcessId.entries()) {
    departmentIdsByProcessId.set(processId, departmentIds.sort());
  }

  return departmentIdsByProcessId;
}

function getDatabaseConflict(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  if ("code" in error && typeof error.code === "string") {
    return error as Record<string, unknown>;
  }

  if ("cause" in error) {
    return getDatabaseConflict(error.cause);
  }

  return null;
}

export function throwIfProcessConflict(error: unknown): never {
  const conflict = getDatabaseConflict(error);

  if (conflict?.code === "23505") {
    const constraint = typeof conflict.constraint === "string" ? conflict.constraint : undefined;

    if (constraint === "processes_organization_process_number_unique") {
      throw new ConflictError("Process number is already in use for this organization.");
    }

    throw new ConflictError("Process conflicts with existing data.");
  }

  throw error;
}
