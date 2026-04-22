import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canListDocuments } from "./documents.policies";
import { getDocumentsVisibilityScope, serializeDocumentSummary } from "./documents.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
};

export async function getDocuments({ actor, db }: Input) {
  canListDocuments(actor);

  if (actor.role !== "admin" && !actor.organizationId) {
    return {
      items: [],
    };
  }

  const scope = getDocumentsVisibilityScope(actor);
  const rows = await db.query.documents.findMany({
    where: scope,
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return {
    items: rows.map(serializeDocumentSummary),
  };
}
