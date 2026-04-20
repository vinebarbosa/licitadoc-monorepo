import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { serializeInvite } from "./create-invite";
import { hashInviteToken } from "./invite.tokens";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  inviteToken: string;
};

export async function acceptInvite({ actor, db, inviteToken }: Input) {
  const tokenHash = hashInviteToken(inviteToken);

  return db.transaction(async (tx) => {
    const invite = await tx.query.invites.findFirst({
      where: (table, { eq }) => eq(table.tokenHash, tokenHash),
    });

    if (!invite) {
      throw new NotFoundError("Invite not found.");
    }

    const user = await tx.query.users.findFirst({
      where: (table, { eq }) => eq(table.id, actor.id),
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (user.email.trim().toLowerCase() !== invite.email) {
      throw new BadRequestError("You can only accept invites sent to your own email.");
    }

    if (invite.status !== "pending") {
      throw new BadRequestError("Invite is no longer pending.");
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestError("Invite has expired.");
    }

    await tx
      .update(users)
      .set({
        role: invite.role,
        organizationId: invite.organizationId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id));

    const [updatedInvite] = await tx
      .update(invites)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        acceptedByUserId: actor.id,
        updatedAt: new Date(),
      })
      .where(and(eq(invites.id, invite.id), eq(invites.status, "pending")))
      .returning();

    if (!updatedInvite) {
      throw new BadRequestError("Invite is no longer pending.");
    }

    return serializeInvite(updatedInvite);
  });
}
