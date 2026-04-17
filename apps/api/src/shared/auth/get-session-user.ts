import type { FastifyRequest } from "fastify";
import type { Actor } from "../../authorization/actor";
import type { Role } from "../../authorization/roles";
import { UnauthorizedError } from "../errors/unauthorized-error";
import { getAuthSession } from "./get-auth-session";

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "organization_owner" || value === "member";
}

export async function getSessionUser(request: FastifyRequest): Promise<Actor> {
  const session = await getAuthSession(request);

  if (!session?.user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (!isRole(session.user.role)) {
    throw new UnauthorizedError("Invalid user role in session.");
  }

  return {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId ?? null,
  };
}
