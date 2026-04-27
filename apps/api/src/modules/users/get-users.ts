import { and, count, eq, ilike, or } from "drizzle-orm";
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
  search?: string;
  role?: Actor["role"];
  organizationId?: string;
};

export async function getUsers({ actor, db, page, pageSize, search, role, organizationId }: Input) {
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

  const normalizedSearch = search?.trim();
  const normalizedOrganizationId =
    actor.role === "organization_owner" ? (actor.organizationId ?? undefined) : organizationId;
  const scope = getUsersVisibilityScope(actor);
  const filters = [
    scope,
    normalizedSearch
      ? or(ilike(users.name, `%${normalizedSearch}%`), ilike(users.email, `%${normalizedSearch}%`))
      : undefined,
    role ? eq(users.role, role) : undefined,
    normalizedOrganizationId ? eq(users.organizationId, normalizedOrganizationId) : undefined,
  ].filter((value) => value !== undefined);
  const where = filters.length === 0 ? undefined : and(...filters);

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(users)
    .where(where);
  const rows = await db.query.users.findMany({
    where,
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
