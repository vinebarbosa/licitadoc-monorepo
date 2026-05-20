import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { canReadStoredUser } from "./users.policies";
import { serializeUser } from "./users.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  userId: string;
};

export async function getUser({ actor, db, userId }: Input) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  canReadStoredUser(actor, user);

  return serializeUser(user);
}
