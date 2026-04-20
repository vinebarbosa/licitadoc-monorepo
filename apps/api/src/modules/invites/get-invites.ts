import { count, eq, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { serializeInvite } from "./create-invite";
import { canListInvites } from "./invites.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
};

function getInviteScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(invites.organizationId, actor.organizationId);
}

export async function getInvites({ actor, db, page, pageSize }: Input) {
  canListInvites(actor);

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

  const scope = getInviteScope(actor);
  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(invites)
    .where(scope);
  const rows = await db.query.invites.findMany({
    where: scope,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  const total = Number(countResult?.total ?? 0);

  return {
    items: rows.map(serializeInvite),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
