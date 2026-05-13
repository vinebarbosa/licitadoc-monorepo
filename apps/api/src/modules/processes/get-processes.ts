import { and, count, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documents, processes } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListProcesses } from "./processes.policies";
import {
  createEmptyProcessListAggregation,
  type ExpectedProcessDocumentType,
  expectedProcessDocumentTypes,
  getDepartmentIdsByProcessIds,
  getProcessItemsByProcessIds,
  getProcessesVisibilityScope,
  isExpectedProcessDocumentType,
  type ProcessListAggregation,
  serializeProcessListItem,
} from "./processes.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
  search?: string | null;
  status?: string | null;
  procurementMethod?: string | null;
  biddingModality?: string | null;
};

function buildProcessesListScope({
  actor,
  biddingModality,
  procurementMethod,
  search,
  status,
}: Pick<Input, "actor" | "biddingModality" | "procurementMethod" | "search" | "status">) {
  const conditions: SQL<unknown>[] = [];
  const visibilityScope = getProcessesVisibilityScope(actor);

  if (visibilityScope) {
    conditions.push(visibilityScope);
  }

  if (search) {
    const pattern = `%${search}%`;
    const searchScope = or(
      ilike(processes.processNumber, pattern),
      ilike(processes.externalId, pattern),
      ilike(processes.object, pattern),
      ilike(processes.title, pattern),
    );

    if (searchScope) {
      conditions.push(searchScope);
    }
  }

  if (status) {
    conditions.push(ilike(processes.status, status));
  }

  if (procurementMethod) {
    conditions.push(ilike(processes.procurementMethod, procurementMethod));
  }

  if (biddingModality) {
    conditions.push(ilike(processes.biddingModality, biddingModality));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

async function getProcessListAggregations({
  db,
  processes: processRows,
}: {
  db: FastifyInstance["db"];
  processes: Array<typeof processes.$inferSelect>;
}) {
  const aggregations = new Map<string, ProcessListAggregation>();

  for (const process of processRows) {
    aggregations.set(process.id, createEmptyProcessListAggregation(process));
  }

  if (processRows.length === 0) {
    return aggregations;
  }

  const rows = await db
    .select({
      processId: documents.processId,
      status: documents.status,
      type: documents.type,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      inArray(
        documents.processId,
        processRows.map((process) => process.id),
      ),
    );

  const completedTypesByProcessId = new Map<string, Set<ExpectedProcessDocumentType>>();

  for (const row of rows) {
    const aggregation = aggregations.get(row.processId);

    if (!aggregation) {
      continue;
    }

    if (row.updatedAt > aggregation.listUpdatedAt) {
      aggregation.listUpdatedAt = row.updatedAt;
    }

    if (row.status === "completed" && isExpectedProcessDocumentType(row.type)) {
      const completedTypes = completedTypesByProcessId.get(row.processId) ?? new Set();
      completedTypes.add(row.type);
      completedTypesByProcessId.set(row.processId, completedTypes);
    }
  }

  for (const [processId, completedTypes] of completedTypesByProcessId.entries()) {
    const aggregation = aggregations.get(processId);

    if (!aggregation) {
      continue;
    }

    const completed = expectedProcessDocumentTypes.filter((documentType) =>
      completedTypes.has(documentType),
    );

    aggregation.documents = {
      completedCount: completed.length,
      totalRequiredCount: expectedProcessDocumentTypes.length,
      completedTypes: completed,
      missingTypes: expectedProcessDocumentTypes.filter(
        (documentType) => !completedTypes.has(documentType),
      ),
    };
  }

  return aggregations;
}

export async function getProcesses({
  actor,
  biddingModality,
  db,
  page,
  pageSize,
  procurementMethod,
  search,
  status,
}: Input) {
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

  const scope = buildProcessesListScope({
    actor,
    biddingModality,
    procurementMethod,
    search,
    status,
  });
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
  const aggregationsByProcessId = await getProcessListAggregations({
    db,
    processes: rows,
  });
  const itemsByProcessId = await getProcessItemsByProcessIds({
    db,
    processIds: rows.map((row) => row.id),
  });

  return {
    items: rows.map((row) =>
      serializeProcessListItem(
        row,
        departmentIdsByProcessId.get(row.id) ?? [],
        aggregationsByProcessId.get(row.id),
        itemsByProcessId.get(row.id) ?? [],
      ),
    ),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
