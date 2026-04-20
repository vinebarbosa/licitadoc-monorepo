import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { validateOrganizationUpdate } from "./organizations.policies";
import type { UpdateOrganizationInput } from "./organizations.schemas";
import {
  assertOrganizationCnpjIsUnique,
  serializeOrganization,
  throwIfOrganizationConflict,
} from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  organizationId: string;
  changes: UpdateOrganizationInput;
};

export async function updateOrganization({ actor, db, organizationId, changes }: Input) {
  const organization = await db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  validateOrganizationUpdate(actor, organization, changes);

  if (changes.cnpj !== undefined) {
    await assertOrganizationCnpjIsUnique({
      db,
      cnpj: changes.cnpj,
      excludeOrganizationId: organizationId,
    });
  }

  let updatedOrganization: typeof organizations.$inferSelect | undefined;

  try {
    [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...changes,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning();
  } catch (error) {
    throwIfOrganizationConflict(error);
  }

  if (!updatedOrganization) {
    throw new NotFoundError("Organization not found.");
  }

  return serializeOrganization(updatedOrganization);
}
