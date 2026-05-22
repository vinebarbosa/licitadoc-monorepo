import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites, users } from "../../db";
import {
  generateTemporaryPassword,
  replaceCredentialPassword,
} from "../../shared/auth/credentials";
import { InviteEmailDeliveryError, type InviteMailer } from "../../shared/email/invite-mailer";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { DEFAULT_INVITE_TTL_MS, serializeInvite } from "./create-invite";
import { generateInviteToken, hashInviteToken } from "./invite.tokens";
import { canManageStoredInvite } from "./invites.policies";

type Input = {
  actor: Actor;
  baseUrl: string;
  db: FastifyInstance["db"];
  inviteId: string;
  mailer: InviteMailer;
};

function toResendInviteRole(role: (typeof invites.$inferSelect)["role"]) {
  if (role === "organization_owner" || role === "member") {
    return role;
  }

  throw new BadRequestError("Invite role is invalid.");
}

export async function resendInvite({ actor, baseUrl, db, inviteId, mailer }: Input) {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.id, inviteId),
  });

  if (!invite) {
    throw new NotFoundError("Invite not found.");
  }

  canManageStoredInvite(actor, invite);

  if (invite.status !== "pending") {
    throw new BadRequestError("Only pending invites can be resent.");
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const role = toResendInviteRole(invite.role);
  const now = new Date();
  const expiresAt = new Date(Date.now() + DEFAULT_INVITE_TTL_MS);
  const temporaryPassword = invite.provisionedUserId ? generateTemporaryPassword() : undefined;

  const updatedInvite = await db.transaction(async (tx) => {
    if (invite.provisionedUserId && temporaryPassword) {
      await tx
        .update(users)
        .set({
          temporaryPasswordCreatedAt: now,
          temporaryPasswordExpiresAt: expiresAt,
          updatedAt: now,
        })
        .where(eq(users.id, invite.provisionedUserId));

      await replaceCredentialPassword({
        db: tx,
        password: temporaryPassword,
        userId: invite.provisionedUserId,
      });
    }

    const [updated] = await tx
      .update(invites)
      .set({
        expiresAt,
        tokenHash,
        updatedAt: now,
      })
      .where(eq(invites.id, invite.id))
      .returning();

    return updated;
  });

  if (!updatedInvite) {
    throw new NotFoundError("Invite not found.");
  }

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
      to: invite.email,
    });
  } catch {
    throw new InviteEmailDeliveryError();
  }

  return {
    ...serializeInvite(updatedInvite),
    token,
    inviteUrl,
  };
}
