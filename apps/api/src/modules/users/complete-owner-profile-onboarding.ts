import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { users } from "../../db";
import { replaceCredentialPassword } from "../../shared/auth/credentials";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { CompleteOwnerProfileOnboardingInput } from "./users.schemas";
import { serializeUser } from "./users.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  profile: CompleteOwnerProfileOnboardingInput;
};

export async function completeOwnerProfileOnboarding({ actor, db, profile }: Input) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: (table, { eq: equals }) => equals(table.id, actor.id),
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const isEligible =
      (user.role === "organization_owner" || user.role === "member") &&
      user.onboardingStatus === "pending_profile";

    if (!isEligible) {
      throw new BadRequestError("Profile onboarding is not available for this user.");
    }

    if (
      user.temporaryPasswordExpiresAt &&
      user.temporaryPasswordExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestError("Temporary password has expired.");
    }

    await replaceCredentialPassword({
      db: tx,
      password: profile.password,
      userId: user.id,
    });

    const nextOnboardingStatus = user.role === "member" ? "complete" : "pending_organization";

    const [updatedUser] = await tx
      .update(users)
      .set({
        name: profile.name,
        onboardingStatus: nextOnboardingStatus,
        temporaryPasswordCreatedAt: null,
        temporaryPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      throw new NotFoundError("User not found.");
    }

    return serializeUser(updatedUser);
  });
}
