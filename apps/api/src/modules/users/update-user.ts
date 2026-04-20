import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { validateUserUpdate } from "./users.policies";
import { type StoredUser, serializeUser } from "./users.shared";

type UserChanges = {
  name?: string;
  role?: StoredUser["role"];
  organizationId?: string | null;
};

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  userId: string;
  changes: UserChanges;
};

export async function updateUser({ actor, db, userId, changes }: Input) {
  const user = await db.query.users.findFirst({
    where: (table, { eq: equals }) => equals(table.id, userId),
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  validateUserUpdate(actor, user, changes);

  const updateValues: Partial<typeof users.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (changes.name !== undefined) {
    updateValues.name = changes.name;
  }

  if (changes.role !== undefined) {
    updateValues.role = changes.role;
  }

  if ("organizationId" in changes) {
    updateValues.organizationId = changes.organizationId ?? null;
  }

  const [updatedUser] = await db
    .update(users)
    .set(updateValues)
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new NotFoundError("User not found.");
  }

  return serializeUser(updatedUser);
}
