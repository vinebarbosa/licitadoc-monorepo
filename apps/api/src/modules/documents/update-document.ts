import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documents } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import {
  documentTextToTiptapJson,
  getTiptapJsonContentHash,
  isTiptapDocumentJson,
  tiptapJsonToDocumentText,
} from "../../shared/tiptap-json";
import { canManageDocument } from "./documents.policies";
import type { UpdateDocumentInput } from "./documents.schemas";
import { serializeDocumentDetail } from "./documents.shared";

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

  const currentJson = isTiptapDocumentJson(document.draftContentJson)
    ? document.draftContentJson
    : documentTextToTiptapJson(document.draftContent);

  if (input.sourceContentHash !== getTiptapJsonContentHash(currentJson)) {
    throw new ConflictError("Document content changed before this save completed.");
  }

  const draftContent = tiptapJsonToDocumentText(input.draftContentJson);

  const [updatedDocument] = await db
    .update(documents)
    .set({
      draftContent,
      draftContentJson: input.draftContentJson,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id))
    .returning();

  if (!updatedDocument) {
    throw new NotFoundError("Document not found.");
  }

  return serializeDocumentDetail(updatedDocument);
}
