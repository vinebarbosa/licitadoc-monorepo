import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { FileStorageProvider } from "../../shared/storage/types";
import {
  type NormalizedLetterheadUpload,
  setOrganizationLetterhead,
} from "./organization-letterhead";
import { canCreateOrganization } from "./organizations.policies";
import type { CreateOrganizationInput } from "./organizations.schemas";
import {
  assertOrganizationCnpjIsUnique,
  serializeOrganization,
  throwIfOrganizationConflict,
} from "./organizations.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  letterheadFile?: NormalizedLetterheadUpload;
  storage?: FileStorageProvider;
  organization: CreateOrganizationInput;
};

export async function createOrganization({
  actor,
  db,
  letterheadFile,
  organization,
  storage,
}: Input) {
  canCreateOrganization(actor);

  if (letterheadFile && !storage) {
    throw new BadRequestError("Letterhead storage is not configured.");
  }

  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, actor.id),
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    canCreateOrganization({
      role: user.role,
      organizationId: user.organizationId,
    });

    if (user.onboardingStatus !== "pending_organization") {
      throw new BadRequestError("Owner profile onboarding must be completed first.");
    }

    await assertOrganizationCnpjIsUnique({
      db: tx,
      cnpj: organization.cnpj,
    });

    let createdOrganization: typeof organizations.$inferSelect | undefined;

    try {
      [createdOrganization] = await tx
        .insert(organizations)
        .values({
          address: organization.address,
          authorityName: organization.authorityName,
          authorityRole: organization.authorityRole,
          city: organization.city,
          cnpj: organization.cnpj,
          createdByUserId: actor.id,
          institutionalEmail: organization.institutionalEmail,
          isActive: true,
          logoUrl: organization.logoUrl,
          name: organization.name,
          officialName: organization.officialName,
          phone: organization.phone,
          slug: organization.slug,
          state: organization.state,
          website: organization.website,
          zipCode: organization.zipCode,
        })
        .returning();
    } catch (error) {
      throwIfOrganizationConflict(error);
    }

    if (!createdOrganization) {
      throw new NotFoundError("Organization could not be created.");
    }

    const organizationWithLetterhead =
      letterheadFile && storage
        ? await setOrganizationLetterhead({
            db: tx,
            file: letterheadFile,
            organization: createdOrganization,
            storage,
          })
        : createdOrganization;

    const [updatedUser] = await tx
      .update(users)
      .set({
        onboardingStatus: "complete",
        organizationId: organizationWithLetterhead.id,
        temporaryPasswordCreatedAt: null,
        temporaryPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, actor.id))
      .returning({
        id: users.id,
      });

    if (!updatedUser) {
      throw new NotFoundError("User not found.");
    }

    return serializeOrganization(organizationWithLetterhead);
  });
}
