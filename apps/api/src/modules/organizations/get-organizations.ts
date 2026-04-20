import { count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListOrganizations } from "./organizations.policies";
import { getOrganizationsVisibilityScope, serializeOrganization } from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
};

export async function getOrganizations({ actor, db, page, pageSize }: Input) {
  canListOrganizations(actor);

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

  const scope = getOrganizationsVisibilityScope(actor);

  const [[countResult], rows] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(organizations)
      .where(scope),
    db.query.organizations.findMany({
      where: scope,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
  ]);

  const total = Number(countResult?.total ?? 0);

  return {
    items: rows.map(serializeOrganization),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
