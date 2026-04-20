import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";
import { generateInviteToken, hashInviteToken } from "./invite.tokens";
import { getInviteRoleForActor } from "./invites.policies";

const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 1; // 1 day

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  baseUrl: string;
  email: string;
  organizationId?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toInviteRole(role: (typeof invites.$inferSelect)["role"]) {
  if (role === "organization_owner" || role === "member") {
    return role;
  }

  throw new BadRequestError("Invite role is invalid.");
}

export async function createInvite({ actor, db, baseUrl, email, organizationId }: Input) {
  const role = getInviteRoleForActor(actor);
  const normalizedEmail = normalizeEmail(email);
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const effectiveOrganizationId =
    actor.role === "organization_owner" ? actor.organizationId : organizationId;
  const expiresAt = new Date(Date.now() + DEFAULT_INVITE_TTL_MS);

  const existingInvite = await db.query.invites.findFirst({
    where: (table, { and, eq, gt }) =>
      and(
        eq(table.email, normalizedEmail),
        eq(table.status, "pending"),
        gt(table.expiresAt, new Date()),
      ),
  });

  if (existingInvite) {
    throw new ConflictError("A pending invite already exists for this email.");
  }

  const [invite] = await db
    .insert(invites)
    .values({
      email: normalizedEmail,
      role,
      organizationId: effectiveOrganizationId ?? null,
      invitedByUserId: actor.id,
      tokenHash,
      expiresAt,
    })
    .returning();

  return {
    ...serializeInvite(invite),
    token,
    inviteUrl: `${baseUrl.replace(/\/$/, "")}/invites/${token}`,
  };
}

function serializeInvite(invite: typeof invites.$inferSelect) {
  return {
    id: invite.id,
    email: invite.email,
    role: toInviteRole(invite.role),
    organizationId: invite.organizationId,
    invitedByUserId: invite.invitedByUserId,
    acceptedByUserId: invite.acceptedByUserId,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString(),
  };
}

export { serializeInvite };
