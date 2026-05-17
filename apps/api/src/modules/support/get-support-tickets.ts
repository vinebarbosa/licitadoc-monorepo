import { and, count, eq, ilike, isNull, lte, ne, or, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { supportTickets } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListSupportTickets } from "./support-tickets.policies";
import {
  getSupportTicketsVisibilityScope,
  loadSupportTicketDetails,
  type SupportTicketPriority,
  type SupportTicketSource,
  type SupportTicketStatus,
} from "./support-tickets.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  source?: SupportTicketSource;
  assignee?: "all" | "unassigned" | "mine";
  requesterOnly?: boolean;
  now?: Date;
};

function buildSupportTicketFilters({
  actor,
  search,
  status,
  priority,
  source,
  assignee,
  requesterOnly,
}: Omit<Input, "db" | "page" | "pageSize" | "now">) {
  const normalizedSearch = search?.trim();
  const filters: Array<SQL<unknown> | undefined> = [
    requesterOnly
      ? eq(supportTickets.requesterUserId, actor.id)
      : getSupportTicketsVisibilityScope(actor),
    status ? eq(supportTickets.status, status) : undefined,
    priority ? eq(supportTickets.priority, priority) : undefined,
    source ? eq(supportTickets.contextSource, source) : undefined,
    assignee === "unassigned" ? isNull(supportTickets.assigneeUserId) : undefined,
    assignee === "mine" ? eq(supportTickets.assigneeUserId, actor.id) : undefined,
    normalizedSearch
      ? or(
          ilike(supportTickets.protocol, `%${normalizedSearch}%`),
          ilike(supportTickets.subject, `%${normalizedSearch}%`),
          ilike(supportTickets.requesterName, `%${normalizedSearch}%`),
          ilike(supportTickets.requesterEmail, `%${normalizedSearch}%`),
          ilike(supportTickets.contextScreen, `%${normalizedSearch}%`),
          ilike(supportTickets.contextRoute, `%${normalizedSearch}%`),
          ilike(supportTickets.contextEntityLabel, `%${normalizedSearch}%`),
        )
      : undefined,
  ];
  const activeFilters = filters.filter((filter): filter is SQL<unknown> => filter !== undefined);

  return activeFilters.length > 0 ? and(...activeFilters) : undefined;
}

function appendSupportTicketFilter(
  where: SQL<unknown> | undefined,
  filter: SQL<unknown>,
) {
  return where ? and(where, filter) : filter;
}

async function countSupportTickets(db: FastifyInstance["db"], where: SQL<unknown> | undefined) {
  const [result] = await db
    .select({
      total: count(),
    })
    .from(supportTickets)
    .where(where);

  return Number(result?.total ?? 0);
}

async function getSupportTicketQueueCounts({
  db,
  where,
  now,
}: {
  db: FastifyInstance["db"];
  where: SQL<unknown> | undefined;
  now: Date;
}) {
  const responseThreshold = new Date(now.getTime() + 3 * 60 * 1000);
  const [open, waiting, resolved, attention] = await Promise.all([
    countSupportTickets(db, appendSupportTicketFilter(where, eq(supportTickets.status, "open"))),
    countSupportTickets(
      db,
      appendSupportTicketFilter(where, eq(supportTickets.status, "waiting")),
    ),
    countSupportTickets(
      db,
      appendSupportTicketFilter(where, eq(supportTickets.status, "resolved")),
    ),
    countSupportTickets(
      db,
      appendSupportTicketFilter(
        appendSupportTicketFilter(where, ne(supportTickets.status, "resolved")),
        lte(supportTickets.firstResponseDueAt, responseThreshold),
      ),
    ),
  ]);

  return {
    all: open + waiting + resolved,
    open,
    waiting,
    resolved,
    attention,
  };
}

export async function getSupportTickets({
  actor,
  db,
  page,
  pageSize,
  search,
  status,
  priority,
  source,
  assignee = "all",
  requesterOnly = false,
  now = new Date(),
}: Input) {
  canListSupportTickets(actor);

  const pagination = normalizePagination({ page, pageSize });

  if (actor.role !== "admin" && !actor.organizationId) {
    return {
      items: [],
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: 0,
      totalPages: 0,
      counts: {
        all: 0,
        open: 0,
        waiting: 0,
        resolved: 0,
        attention: 0,
      },
    };
  }

  const where = buildSupportTicketFilters({
    actor,
    search,
    status,
    priority,
    source,
    assignee,
    requesterOnly,
  });
  const metricWhere = buildSupportTicketFilters({
    actor,
    search,
    priority,
    source,
    assignee,
    requesterOnly,
  });

  const [total, ticketRows, counts] = await Promise.all([
    countSupportTickets(db, where),
    db.query.supportTickets.findMany({
      where,
      orderBy: (table, { desc }) => [desc(table.updatedAt)],
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
    getSupportTicketQueueCounts({ db, where: metricWhere, now }),
  ]);
  const items = await loadSupportTicketDetails({ actor, db, tickets: ticketRows });

  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
    counts,
  };
}
