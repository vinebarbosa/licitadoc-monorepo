import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canListUsers } from "./users.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
};

export async function getUsers({ actor }: Input) {
  canListUsers(actor);

  return {
    items: [
      {
        id: "user_1",
        email: "admin@licitadoc.dev",
        role: "admin",
      },
    ],
  };
}
