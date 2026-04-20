import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredOrganization } from "./organizations.policies";
import { serializeOrganization } from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  organizationId: string;
};

export async function getOrganization({ actor, db, organizationId }: Input) {
  const organization = await db.query.organizations.findFirst({
    where: (table, { eq }) => eq(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  canReadStoredOrganization(actor, organization);

  return serializeOrganization(organization);
}
