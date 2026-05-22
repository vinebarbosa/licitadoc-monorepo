import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { invites, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { serializeInvite } from "./create-invite";
import { canManageStoredInvite } from "./invites.policies";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  inviteId: string;
};

export async function revokeInvite({ actor, db, inviteId }: Input) {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.id, inviteId),
  });

  if (!invite) {
    throw new NotFoundError("Invite not found.");
  }

  canManageStoredInvite(actor, invite);

  if (invite.status !== "pending") {
    throw new BadRequestError("Only pending invites can be revoked.");
  }

  const updatedInvite = await db.transaction(async (tx) => {
    if (invite.provisionedUserId) {
      const provisionedUser = await tx.query.users.findFirst({
        where: eq(users.id, invite.provisionedUserId),
      });

      if (provisionedUser?.onboardingStatus === "pending_profile") {
        await tx.delete(users).where(eq(users.id, invite.provisionedUserId));
      }
    }

    const [updated] = await tx
      .update(invites)
      .set({
        provisionedUserId: null,
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(invites.id, invite.id))
      .returning();

    return updated;
  });

  if (!updatedInvite) {
    throw new NotFoundError("Invite not found.");
  }

  return serializeInvite(updatedInvite);
}
