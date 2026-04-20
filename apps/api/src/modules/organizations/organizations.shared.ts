import { and, eq, ne, type SQL, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations } from "../../db";
import { ConflictError } from "../../shared/errors/conflict-error";

export type StoredOrganization = typeof organizations.$inferSelect;

export function isActorInOrganization(
  actor: Actor,
  targetOrganization: Pick<StoredOrganization, "id">,
) {
  return actor.organizationId !== null && actor.organizationId === targetOrganization.id;
}

export function getOrganizationsVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(organizations.id, actor.organizationId);
}

export function serializeOrganization(organization: StoredOrganization) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    officialName: organization.officialName,
    cnpj: organization.cnpj,
    city: organization.city,
    state: organization.state,
    address: organization.address,
    zipCode: organization.zipCode,
    phone: organization.phone,
    institutionalEmail: organization.institutionalEmail,
    website: organization.website ?? null,
    logoUrl: organization.logoUrl ?? null,
    authorityName: organization.authorityName,
    authorityRole: organization.authorityRole,
    isActive: organization.isActive,
    createdByUserId: organization.createdByUserId,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}

export function getCnpjDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function assertOrganizationCnpjIsUnique({
  db,
  cnpj,
  excludeOrganizationId,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  cnpj: string;
  excludeOrganizationId?: string;
}) {
  const cnpjDigits = getCnpjDigits(cnpj);

  const [existingOrganization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      excludeOrganizationId
        ? and(
            sql`regexp_replace(${organizations.cnpj}, '[^0-9]', '', 'g') = ${cnpjDigits}`,
            ne(organizations.id, excludeOrganizationId),
          )
        : sql`regexp_replace(${organizations.cnpj}, '[^0-9]', '', 'g') = ${cnpjDigits}`,
    )
    .limit(1);

  if (existingOrganization) {
    throw new ConflictError("Organization CNPJ is already in use.");
  }
}

export function throwIfOrganizationConflict(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
    const constraint =
      "constraint" in error && typeof error.constraint === "string" ? error.constraint : undefined;

    if (constraint === "organizations_slug_unique") {
      throw new ConflictError("Organization slug is already in use.");
    }

    if (
      constraint === "organizations_cnpj_unique" ||
      constraint === "organizations_cnpj_digits_unique"
    ) {
      throw new ConflictError("Organization CNPJ is already in use.");
    }

    throw new ConflictError("Organization conflicts with existing data.");
  }

  throw error;
}
