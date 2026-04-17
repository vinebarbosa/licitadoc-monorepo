import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canReadUser } from "./users.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  userId: string;
};

export async function getUser({ actor, userId }: Input) {
  canReadUser(actor);

  return {
    id: userId,
    email: "owner@organization.dev",
    role: actor.role,
  };
}
