import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canManageProcess } from "./processes.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
};

export async function getProcesses({ actor }: Input) {
  canManageProcess(actor, actor.organizationId ?? "unknown");

  return {
    items: [],
  };
}
