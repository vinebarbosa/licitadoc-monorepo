import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites, users } from "../../db";
import { createCredentialAccount, generateTemporaryPassword } from "../../shared/auth/credentials";
import { InviteEmailDeliveryError, type InviteMailer } from "../../shared/email/invite-mailer";
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
  mailer: InviteMailer;
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

export async function createInvite({ actor, db, baseUrl, email, mailer, organizationId }: Input) {
  const role = getInviteRoleForActor(actor);
  const normalizedEmail = normalizeEmail(email);
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const effectiveOrganizationId =
    actor.role === "organization_owner" ? actor.organizationId : organizationId;
  const expiresAt = new Date(Date.now() + DEFAULT_INVITE_TTL_MS);
  const now = new Date();

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

  const temporaryPassword =
    role === "organization_owner" || role === "member" ? generateTemporaryPassword() : undefined;
  const { invite, provisionedUserId } = await db.transaction(async (tx) => {
    let provisionedUserId: string | null = null;

    if (role === "organization_owner" || role === "member") {
      const existingUser = await tx.query.users.findFirst({
        where: (table, { eq }) => eq(table.email, normalizedEmail),
      });

      if (existingUser) {
        throw new ConflictError("A user already exists for this email.");
      }

      provisionedUserId = randomUUID();

      await tx.insert(users).values({
        id: provisionedUserId,
        name: normalizedEmail,
        email: normalizedEmail,
        emailVerified: false,
        role,
        organizationId: role === "member" ? (effectiveOrganizationId ?? null) : null,
        onboardingStatus: "pending_profile",
        temporaryPasswordCreatedAt: now,
        temporaryPasswordExpiresAt: expiresAt,
      });

      await createCredentialAccount({
        db: tx,
        password: temporaryPassword ?? generateTemporaryPassword(),
        userId: provisionedUserId,
      });
    }

    const [invite] = await tx
      .insert(invites)
      .values({
        email: normalizedEmail,
        role,
        organizationId: role === "organization_owner" ? null : (effectiveOrganizationId ?? null),
        invitedByUserId: actor.id,
        provisionedUserId,
        tokenHash,
        expiresAt,
      })
      .returning();

    return { invite, provisionedUserId };
  });

  const inviteUrl = `${baseUrl.replace(/\/$/, "")}/invites/${token}`;
  const signInUrl = `${baseUrl.replace(/\/$/, "")}/entrar`;

  try {
    await mailer.sendInviteEmail({
      expiresAt,
      inviteId: invite.id,
      inviteUrl,
      role,
      signInUrl,
      temporaryPassword,
      to: normalizedEmail,
    });
  } catch {
    throw new InviteEmailDeliveryError();
  }

  return {
    ...serializeInvite(invite),
    token,
    inviteUrl,
    provisionedUserId,
  };
}

function serializeInvite(invite: typeof invites.$inferSelect) {
  return {
    id: invite.id,
    email: invite.email,
    role: toInviteRole(invite.role),
    organizationId: invite.organizationId,
    invitedByUserId: invite.invitedByUserId,
    provisionedUserId: invite.provisionedUserId,
    acceptedByUserId: invite.acceptedByUserId,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString(),
  };
}

export { serializeInvite };
