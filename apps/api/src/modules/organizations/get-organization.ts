import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canReadOrganization } from "./organizations.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  organizationId: string;
};

export async function getOrganization({ actor, organizationId }: Input) {
  canReadOrganization(actor, organizationId);

  return {
    id: organizationId,
    name: "Organization Placeholder",
  };
}
