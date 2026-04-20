import { eq, type SQL } from "drizzle-orm";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";

export type StoredUser = typeof users.$inferSelect;

export function isActorInSameOrganization(
  actor: Actor,
  targetUser: Pick<StoredUser, "organizationId">,
) {
  return actor.organizationId !== null && actor.organizationId === targetUser.organizationId;
}

export function getUsersVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(users.organizationId, actor.organizationId);
}

export function serializeUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    role: user.role,
    organizationId: user.organizationId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
