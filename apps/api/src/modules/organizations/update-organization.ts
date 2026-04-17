import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canUpdateOrganization } from "./organizations.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  organizationId: string;
};

export async function updateOrganization({ actor, organizationId }: Input) {
  canUpdateOrganization(actor, organizationId);

  return {
    id: organizationId,
    updated: true,
  };
}
