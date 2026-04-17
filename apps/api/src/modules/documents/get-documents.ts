import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canManageDocument } from "./documents.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
};

export async function getDocuments({ actor }: Input) {
  canManageDocument(actor, actor.organizationId ?? "unknown");

  return {
    items: [],
  };
}
