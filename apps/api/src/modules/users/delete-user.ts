import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canDeleteStoredUser } from "./users.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  userId: string;
};

export async function deleteUser({ actor, db, userId }: Input) {
  const user = await db.query.users.findFirst({
    where: (table, { eq: equals }) => equals(table.id, userId),
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  canDeleteStoredUser(actor, user);

  const [deletedUser] = await db.delete(users).where(eq(users.id, userId)).returning({
    id: users.id,
  });

  if (!deletedUser) {
    throw new NotFoundError("User not found.");
  }

  return {
    success: true as const,
  };
}
