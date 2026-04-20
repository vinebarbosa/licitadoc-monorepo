import { count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListUsers } from "./users.policies";
import { getUsersVisibilityScope, serializeUser } from "./users.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
};

export async function getUsers({ actor, db, page, pageSize }: Input) {
  canListUsers(actor);

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

  const scope = getUsersVisibilityScope(actor);
  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(users)
    .where(scope);
  const rows = await db.query.users.findMany({
    where: scope,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: pagination.pageSize,
    offset: pagination.offset,
  });
  const total = Number(countResult?.total ?? 0);

  return {
    items: rows.map(serializeUser),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
