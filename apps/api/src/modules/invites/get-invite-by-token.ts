import type { FastifyInstance } from "fastify";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import { hashInviteToken } from "./invite.tokens";

function toInviteRole(role: "admin" | "organization_owner" | "member") {
  if (role === "organization_owner" || role === "member") {
    return role;
  }

  throw new BadRequestError("Invite role is invalid.");
}

type Input = {
  db: FastifyInstance["db"];
  inviteToken: string;
};

export async function getInviteByToken({ db, inviteToken }: Input) {
  const invite = await db.query.invites.findFirst({
    where: (table, { eq }) => eq(table.tokenHash, hashInviteToken(inviteToken)),
  });

  if (!invite) {
    throw new NotFoundError("Invite not found.");
  }

  return {
    id: invite.id,
    email: invite.email,
    role: toInviteRole(invite.role),
    organizationId: invite.organizationId,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    isExpired: invite.expiresAt.getTime() <= Date.now(),
  };
}
