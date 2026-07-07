import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documentGenerationRuns, documents, organizations, processes } from "../../db";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { normalizePagination } from "../../shared/http/pagination";
import type { AiUsageQuery } from "./ai-usage.schemas";
import { normalizeAiUsageRunMetadata } from "./ai-usage-normalization";

type AiUsageSort = "recent" | "cost_desc";

export type AiUsageJoinedRunRow = {
  createdAt: Date;
  documentId: string;
  documentName: string | null;
  documentOrganizationId: string | null;
  documentType: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  fallbackDocumentType: string | null;
  fallbackOrganizationId: string | null;
  finishedAt: Date | null;
  id: string;
  model: string;
  organizationId: string | null;
  organizationName: string | null;
  processId: string | null;
  processNumber: string | null;
  processObject: string | null;
  processTitle: string | null;
  providerKey: string;
  requestMetadata: Record<string, unknown>;
  responseMetadata: Record<string, unknown> | null;
  startedAt: Date;
  status: string;
};

type NormalizedAiUsageRun = AiUsageJoinedRunRow & {
  callCount: number;
  costKnown: boolean;
  costUsd: number | null;
  durationMs: number | null;
  normalizedDocumentType: string;
  normalizedOrganizationId: string | null;
  occurredAt: Date;
  totalCachedInputTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
};

type BreakdownAccumulator = {
  key: string;
  knownCostUsd: number;
  label: string;
  runCount: number;
  totalTokens: number;
  unknownCostRunCount: number;
};

type TrendAccumulator = {
  costUsd: number;
  date: string;
  failedRunCount: number;
  runCount: number;
  totalTokens: number;
};

type BuildInput = {
  now?: Date;
  query?: AiUsageQuery;
  rows: AiUsageJoinedRunRow[];
};

const DEFAULT_PERIOD_DAYS = 30;
const UNKNOWN_LABEL = "Nao informado";

function roundMetric(value: number) {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function getDefaultFrom(now: Date) {
  return new Date(now.getTime() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

function getDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDateKeysInRange(from: Date, to: Date) {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());

  if (start > end) {
    return [];
  }

  const dates: string[] = [];

  for (let timestamp = start; timestamp <= end; timestamp += 24 * 60 * 60 * 1000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }

  return dates;
}

function getDurationMs(startedAt: Date, finishedAt: Date | null) {
  if (!finishedAt) {
    return null;
  }

  return Math.max(0, finishedAt.getTime() - startedAt.getTime());
}

function getProcessLabel(row: AiUsageJoinedRunRow) {
  const labelParts = [row.processNumber, row.processTitle ?? row.processObject].filter(
    (value): value is string => Boolean(value),
  );

  return labelParts.length > 0 ? labelParts.join(" - ") : null;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(row: NormalizedAiUsageRun, search: string | undefined) {
  const needle = search ? normalizeSearchValue(search) : "";

  if (!needle) {
    return true;
  }

  const searchableText = [
    row.documentName,
    row.normalizedDocumentType,
    row.organizationName,
    row.processNumber,
    row.processObject,
    row.processTitle,
    row.model,
    row.providerKey,
    row.status,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSearchValue)
    .join(" ");

  return searchableText.includes(needle);
}

function normalizeRow(row: AiUsageJoinedRunRow): NormalizedAiUsageRun {
  const metadata = normalizeAiUsageRunMetadata({
    createdAt: row.createdAt,
    documentOrganizationId: row.documentOrganizationId,
    documentType: row.documentType,
    fallbackDocumentType: row.fallbackDocumentType,
    fallbackOrganizationId: row.fallbackOrganizationId,
    finishedAt: row.finishedAt,
    requestMetadata: row.requestMetadata,
    responseMetadata: row.responseMetadata,
    startedAt: row.startedAt,
  });

  return {
    ...row,
    callCount: metadata.callCount,
    costKnown: metadata.costKnown,
    costUsd: metadata.costUsd,
    durationMs: getDurationMs(row.startedAt, row.finishedAt),
    normalizedDocumentType: metadata.documentType,
    normalizedOrganizationId: metadata.organizationId,
    occurredAt: metadata.occurredAt,
    totalCachedInputTokens: metadata.usage.input_tokens_details.cached_tokens,
    totalInputTokens: metadata.usage.input_tokens,
    totalOutputTokens: metadata.usage.output_tokens,
    totalTokens: metadata.usage.total_tokens,
  };
}

function matchesQuery(row: NormalizedAiUsageRun, query: AiUsageQuery | undefined) {
  if (query?.organizationId && row.normalizedOrganizationId !== query.organizationId) {
    return false;
  }

  if (query?.documentType && row.normalizedDocumentType !== query.documentType) {
    return false;
  }

  if (query?.providerKey && row.providerKey !== query.providerKey) {
    return false;
  }

  if (query?.model && row.model !== query.model) {
    return false;
  }

  if (query?.status && row.status !== query.status) {
    return false;
  }

  if (!matchesSearch(row, query?.search)) {
    return false;
  }

  return true;
}

function createBreakdownItem({
  item,
  totalKnownCostUsd,
}: {
  item: BreakdownAccumulator;
  totalKnownCostUsd: number;
}) {
  return {
    key: item.key,
    knownCostUsd: roundMetric(item.knownCostUsd),
    label: item.label,
    runCount: item.runCount,
    shareOfKnownCost:
      totalKnownCostUsd > 0 ? roundMetric(item.knownCostUsd / totalKnownCostUsd) : null,
    totalTokens: item.totalTokens,
    unknownCostRunCount: item.unknownCostRunCount,
  };
}

function addBreakdownValue({
  accumulator,
  costKnown,
  costUsd,
  key,
  label,
  totalTokens,
}: {
  accumulator: Map<string, BreakdownAccumulator>;
  costKnown: boolean;
  costUsd: number | null;
  key: string;
  label: string;
  totalTokens: number;
}) {
  const current =
    accumulator.get(key) ??
    ({
      key,
      knownCostUsd: 0,
      label,
      runCount: 0,
      totalTokens: 0,
      unknownCostRunCount: 0,
    } satisfies BreakdownAccumulator);

  current.runCount += 1;
  current.totalTokens += totalTokens;

  if (costKnown) {
    current.knownCostUsd += costUsd ?? 0;
  } else {
    current.unknownCostRunCount += 1;
  }

  accumulator.set(key, current);
}

function buildBreakdown(
  rows: NormalizedAiUsageRun[],
  getValue: (row: NormalizedAiUsageRun) => { key: string | null; label: string | null },
  totalKnownCostUsd: number,
) {
  const accumulator = new Map<string, BreakdownAccumulator>();

  for (const row of rows) {
    const value = getValue(row);
    const key = value.key ?? "unknown";

    addBreakdownValue({
      accumulator,
      costKnown: row.costKnown,
      costUsd: row.costUsd,
      key,
      label: value.label ?? UNKNOWN_LABEL,
      totalTokens: row.totalTokens,
    });
  }

  return Array.from(accumulator.values())
    .sort((left, right) => right.knownCostUsd - left.knownCostUsd || right.runCount - left.runCount)
    .map((item) => createBreakdownItem({ item, totalKnownCostUsd }));
}

function buildTrend(rows: NormalizedAiUsageRun[], from: Date, to: Date) {
  const accumulator = new Map<string, TrendAccumulator>();

  for (const date of getDateKeysInRange(from, to)) {
    accumulator.set(date, {
      costUsd: 0,
      date,
      failedRunCount: 0,
      runCount: 0,
      totalTokens: 0,
    });
  }

  for (const row of rows) {
    const date = getDateKey(row.occurredAt);
    const current =
      accumulator.get(date) ??
      ({
        costUsd: 0,
        date,
        failedRunCount: 0,
        runCount: 0,
        totalTokens: 0,
      } satisfies TrendAccumulator);

    current.runCount += 1;
    current.totalTokens += row.totalTokens;

    if (row.status === "failed") {
      current.failedRunCount += 1;
    }

    if (row.costKnown) {
      current.costUsd += row.costUsd ?? 0;
    }

    accumulator.set(date, current);
  }

  return Array.from(accumulator.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((item) => ({
      ...item,
      costUsd: roundMetric(item.costUsd),
    }));
}

function sortRuns(rows: NormalizedAiUsageRun[], sort: AiUsageSort) {
  return [...rows].sort((left, right) => {
    if (sort === "cost_desc") {
      const costDelta = (right.costUsd ?? -1) - (left.costUsd ?? -1);

      if (costDelta !== 0) {
        return costDelta;
      }
    }

    return right.occurredAt.getTime() - left.occurredAt.getTime();
  });
}

export function buildAiUsageDashboard({ now = new Date(), query, rows }: BuildInput) {
  const from = parseDate(query?.from, getDefaultFrom(now));
  const to = parseDate(query?.to, now);
  const pagination = normalizePagination({ page: query?.page, pageSize: query?.pageSize });
  const sort = query?.sort ?? "recent";
  const filteredRows = rows
    .map(normalizeRow)
    .filter((row) => row.occurredAt >= from && row.occurredAt <= to)
    .filter((row) => matchesQuery(row, query));
  const knownCostUsd = filteredRows.reduce(
    (total, row) => total + (row.costKnown ? (row.costUsd ?? 0) : 0),
    0,
  );
  const completedRows = filteredRows.filter((row) => row.status === "completed");
  const completedKnownCostUsd = completedRows.reduce(
    (total, row) => total + (row.costKnown ? (row.costUsd ?? 0) : 0),
    0,
  );
  const completedDocumentIds = new Set(completedRows.map((row) => row.documentId));
  const failedRunCount = filteredRows.filter((row) => row.status === "failed").length;
  const totalInputTokens = filteredRows.reduce((total, row) => total + row.totalInputTokens, 0);
  const totalOutputTokens = filteredRows.reduce((total, row) => total + row.totalOutputTokens, 0);
  const totalCachedInputTokens = filteredRows.reduce(
    (total, row) => total + row.totalCachedInputTokens,
    0,
  );
  const totalTokens = filteredRows.reduce((total, row) => total + row.totalTokens, 0);
  const sortedRows = sortRuns(filteredRows, sort);
  const paginatedRows = sortedRows.slice(
    pagination.offset,
    pagination.offset + pagination.pageSize,
  );

  return {
    breakdowns: {
      documentTypes: buildBreakdown(
        filteredRows,
        (row) => ({
          key: row.normalizedDocumentType,
          label: row.normalizedDocumentType.toUpperCase(),
        }),
        knownCostUsd,
      ),
      models: buildBreakdown(
        filteredRows,
        (row) => ({ key: row.model, label: row.model }),
        knownCostUsd,
      ),
      organizations: buildBreakdown(
        filteredRows,
        (row) => ({
          key: row.normalizedOrganizationId,
          label: row.organizationName,
        }),
        knownCostUsd,
      ),
      providers: buildBreakdown(
        filteredRows,
        (row) => ({ key: row.providerKey, label: row.providerKey }),
        knownCostUsd,
      ),
      statuses: buildBreakdown(
        filteredRows,
        (row) => ({ key: row.status, label: row.status }),
        knownCostUsd,
      ),
    },
    filters: {
      documentType: query?.documentType ?? null,
      from: from.toISOString(),
      model: query?.model ?? null,
      organizationId: query?.organizationId ?? null,
      page: pagination.page,
      pageSize: pagination.pageSize,
      providerKey: query?.providerKey ?? null,
      search: query?.search || null,
      sort,
      status: query?.status ?? null,
      to: to.toISOString(),
    },
    recentRuns: {
      items: paginatedRows.map((row) => ({
        callCount: row.callCount,
        costKnown: row.costKnown,
        costUsd: row.costUsd,
        documentId: row.documentId,
        documentName: row.documentName ?? "Documento sem nome",
        documentType: row.normalizedDocumentType,
        durationMs: row.durationMs,
        errorCode: row.errorCode,
        errorMessage: row.errorMessage,
        finishedAt: row.finishedAt?.toISOString() ?? null,
        id: row.id,
        model: row.model,
        organizationId: row.normalizedOrganizationId,
        organizationName: row.organizationName ?? UNKNOWN_LABEL,
        processId: row.processId,
        processLabel: getProcessLabel(row),
        providerKey: row.providerKey,
        startedAt: row.startedAt.toISOString(),
        status: row.status,
        totalCachedInputTokens: row.totalCachedInputTokens,
        totalInputTokens: row.totalInputTokens,
        totalOutputTokens: row.totalOutputTokens,
        totalTokens: row.totalTokens,
      })),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: filteredRows.length,
      totalPages:
        filteredRows.length === 0 ? 0 : Math.ceil(filteredRows.length / pagination.pageSize),
    },
    summary: {
      averageCostPerCompletedDocumentUsd:
        completedDocumentIds.size > 0
          ? roundMetric(completedKnownCostUsd / completedDocumentIds.size)
          : null,
      cacheInputTokenShare:
        totalInputTokens > 0 ? roundMetric(totalCachedInputTokens / totalInputTokens) : null,
      completedRunCount: completedRows.length,
      failedRunCount,
      failureRate:
        filteredRows.length > 0 ? roundMetric(failedRunCount / filteredRows.length) : null,
      generatedDocumentCount: completedDocumentIds.size,
      knownCostUsd: roundMetric(knownCostUsd),
      runCount: filteredRows.length,
      totalCachedInputTokens,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      unknownCostRunCount: filteredRows.filter((row) => !row.costKnown).length,
    },
    trend: buildTrend(filteredRows, from, to),
  };
}

function buildDbFilters({ from, query, to }: { from: Date; query: AiUsageQuery; to: Date }) {
  const filters: Array<SQL<unknown> | undefined> = [
    gte(documentGenerationRuns.startedAt, from),
    lte(documentGenerationRuns.startedAt, to),
    query.providerKey ? eq(documentGenerationRuns.providerKey, query.providerKey) : undefined,
    query.model ? eq(documentGenerationRuns.model, query.model) : undefined,
    query.status ? eq(documentGenerationRuns.status, query.status) : undefined,
  ];
  const activeFilters = filters.filter((filter): filter is SQL<unknown> => filter !== undefined);

  return activeFilters.length > 0 ? and(...activeFilters) : undefined;
}

export async function getAiUsage({
  actor,
  db,
  now = new Date(),
  query = {},
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  now?: Date;
  query?: AiUsageQuery;
}) {
  if (actor.role !== "admin") {
    throw new ForbiddenError("You do not have permission to view AI usage.");
  }

  const from = parseDate(query.from, getDefaultFrom(now));
  const to = parseDate(query.to, now);
  const where = buildDbFilters({ from, query, to });
  const rows = await db
    .select({
      createdAt: documentGenerationRuns.createdAt,
      documentId: documentGenerationRuns.documentId,
      documentName: documents.name,
      documentOrganizationId: documents.organizationId,
      documentType: documents.type,
      errorCode: documentGenerationRuns.errorCode,
      errorMessage: documentGenerationRuns.errorMessage,
      fallbackDocumentType: documentGenerationRuns.requestMetadata,
      fallbackOrganizationId: documentGenerationRuns.requestMetadata,
      finishedAt: documentGenerationRuns.finishedAt,
      id: documentGenerationRuns.id,
      model: documentGenerationRuns.model,
      organizationId: organizations.id,
      organizationName: organizations.name,
      processId: processes.id,
      processNumber: processes.processNumber,
      processObject: processes.object,
      processTitle: processes.title,
      providerKey: documentGenerationRuns.providerKey,
      requestMetadata: documentGenerationRuns.requestMetadata,
      responseMetadata: documentGenerationRuns.responseMetadata,
      startedAt: documentGenerationRuns.startedAt,
      status: documentGenerationRuns.status,
    })
    .from(documentGenerationRuns)
    .leftJoin(documents, eq(documents.id, documentGenerationRuns.documentId))
    .leftJoin(processes, eq(processes.id, documents.processId))
    .leftJoin(organizations, eq(organizations.id, documents.organizationId))
    .where(where)
    .orderBy(desc(documentGenerationRuns.startedAt));

  return buildAiUsageDashboard({
    now,
    query,
    rows: rows.map((row) => ({
      ...row,
      fallbackDocumentType:
        typeof row.fallbackDocumentType.documentType === "string"
          ? row.fallbackDocumentType.documentType
          : null,
      fallbackOrganizationId:
        typeof row.fallbackOrganizationId.organizationId === "string"
          ? row.fallbackOrganizationId.organizationId
          : null,
    })),
  });
}
