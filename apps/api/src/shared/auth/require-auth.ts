import type { FastifyRequest } from "fastify";
import { getSessionUser } from "./get-session-user";

export async function requireAuth(request: FastifyRequest) {
  await getSessionUser(request);
}
