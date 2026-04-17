import { fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest } from "fastify";

export async function getAuthSession(request: FastifyRequest) {
  return request.server.auth.api.getSession({
    headers: fromNodeHeaders(request.raw.headers),
  });
}
