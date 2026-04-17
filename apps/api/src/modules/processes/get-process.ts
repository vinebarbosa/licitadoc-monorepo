import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { canManageProcess } from "./processes.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  processId: string;
};

export async function getProcess({ actor, processId }: Input) {
  canManageProcess(actor, actor.organizationId ?? "unknown");

  return {
    id: processId,
    title: "Process Placeholder",
    organizationId: actor.organizationId,
  };
}
