import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canManageDocument } from "./documents.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  documentId: string;
};

export async function getDocument({ actor, documentId }: Input) {
  canManageDocument(actor, actor.organizationId ?? "unknown");

  return {
    id: documentId,
    name: "Document Placeholder",
    organizationId: actor.organizationId,
  };
}
