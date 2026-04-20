import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations, users } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canCreateOrganization } from "./organizations.policies";
import type { CreateOrganizationInput } from "./organizations.schemas";
import {
  assertOrganizationCnpjIsUnique,
  serializeOrganization,
  throwIfOrganizationConflict,
} from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  organization: CreateOrganizationInput;
};

export async function createOrganization({ actor, db, organization }: Input) {
  canCreateOrganization(actor);

  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: (table, { eq: equals }) => equals(table.id, actor.id),
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    canCreateOrganization({
      role: user.role,
      organizationId: user.organizationId,
    });

    await assertOrganizationCnpjIsUnique({
      db: tx,
      cnpj: organization.cnpj,
    });

    let createdOrganization: typeof organizations.$inferSelect | undefined;

    try {
      [createdOrganization] = await tx
        .insert(organizations)
        .values({
          ...organization,
          isActive: true,
          createdByUserId: actor.id,
        })
        .returning();
    } catch (error) {
      throwIfOrganizationConflict(error);
    }

    if (!createdOrganization) {
      throw new NotFoundError("Organization could not be created.");
    }

    const [updatedUser] = await tx
      .update(users)
      .set({
        organizationId: createdOrganization.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id))
      .returning({
        id: users.id,
      });

    if (!updatedUser) {
      throw new NotFoundError("User not found.");
    }

    return serializeOrganization(createdOrganization);
  });
}
