import type { FastifyRequest } from "fastify";
import { ForbiddenError } from "../errors/forbidden-error";
import { getSessionUser } from "./get-session-user";

export async function requireAdmin(request: FastifyRequest) {
  const actor = await getSessionUser(request);

  if (actor.role !== "admin") {
    throw new ForbiddenError("Admin access required.");
  }
}
