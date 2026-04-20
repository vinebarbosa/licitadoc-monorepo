import { count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments } from "../../db";
import { normalizePagination } from "../../shared/http/pagination";
import { canListDepartments } from "./departments.policies";
import { getDepartmentsVisibilityScope, serializeDepartment } from "./departments.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  page?: number;
  pageSize?: number;
};

export async function getDepartments({ actor, db, page, pageSize }: Input) {
  canListDepartments(actor);

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

  const scope = getDepartmentsVisibilityScope(actor);
  const [[countResult], rows] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(departments)
      .where(scope),
    db.query.departments.findMany({
      where: scope,
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
  ]);

  const total = Number(countResult?.total ?? 0);

  return {
    items: rows.map(serializeDepartment),
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.pageSize),
  };
}
