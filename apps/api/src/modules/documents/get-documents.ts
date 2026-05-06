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

  const uniqueProcessIds = [...new Set(rows.map((r) => r.processId))];
  const processRows =
    uniqueProcessIds.length > 0
      ? await db.query.processes.findMany({
          where: (table, { inArray: inArr }) => inArr(table.id, uniqueProcessIds),
        })
      : [];
  const processByIdMap = new Map(processRows.map((p) => [p.id, p]));

  return {
    items: rows.map((doc) => serializeDocumentSummary(doc, processByIdMap.get(doc.processId))),
  };
}
