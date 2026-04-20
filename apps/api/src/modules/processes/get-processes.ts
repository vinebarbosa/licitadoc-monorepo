import { count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { processes } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListProcesses } from "./processes.policies";
import {
  getDepartmentIdsByProcessIds,
  getProcessesVisibilityScope,
  serializeProcess,
} from "./processes.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
};

export async function getProcesses({ actor, db, page, pageSize }: Input) {
  canListProcesses(actor);

  const pagination = normalizePagination({ page, pageSize });

  if (actor.role !== "admin" && !actor.organizationId) {
    return {
      items: [],
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: 0,
      totalPages: 0,
    };
  }

  const scope = getProcessesVisibilityScope(actor);
  const [[countResult], rows] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(processes)
      .where(scope),
    db.query.processes.findMany({
      where: scope,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
  ]);

  const total = Number(countResult?.total ?? 0);
  const departmentIdsByProcessId = await getDepartmentIdsByProcessIds({
    db,
    processIds: rows.map((row) => row.id),
  });

  return {
    items: rows.map((row) => serializeProcess(row, departmentIdsByProcessId.get(row.id) ?? [])),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
