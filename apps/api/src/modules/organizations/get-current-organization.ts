import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadCurrentOrganization } from "./organizations.policies";
import { serializeOrganization } from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
};

export async function getCurrentOrganization({ actor, db }: Input) {
  const organizationId = canReadCurrentOrganization(actor);

  const organization = await db.query.organizations.findFirst({
    where: (table, { eq }) => eq(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  return serializeOrganization(organization);
}
