import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredDocument } from "./documents.policies";
import { serializeDocumentDetail } from "./documents.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
};

export async function getDocument({ actor, db, documentId }: Input) {
  const document = await db.query.documents.findFirst({
    where: (table, { eq }) => eq(table.id, documentId),
  });

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  canReadStoredDocument(actor, document);

  return serializeDocumentDetail(document);
}
