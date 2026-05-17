import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documents } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { UpdateDocumentInput } from "./documents.schemas";
import { canManageDocument } from "./documents.policies";
import { serializeDocumentDetail } from "./documents.shared";
import { getDocumentContentHash } from "./document-text-adjustment";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
  input: UpdateDocumentInput;
};

export async function updateDocument({ actor, db, documentId, input }: Input) {
  const document = await db.query.documents.findFirst({
    where: (table, { eq: equals }) => equals(table.id, documentId),
  });

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  canManageDocument(actor, document.organizationId);

  if (document.status !== "completed" || !document.draftContent?.trim()) {
    throw new BadRequestError("Document must be completed and contain draft content.");
  }

  if (input.sourceContentHash !== getDocumentContentHash(document.draftContent)) {
    throw new ConflictError("Document content changed before this save completed.");
  }

  const [updatedDocument] = await db
    .update(documents)
    .set({
      draftContent: input.draftContent,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id))
    .returning();

  if (!updatedDocument) {
    throw new NotFoundError("Document not found.");
  }

  return serializeDocumentDetail(updatedDocument);
}
