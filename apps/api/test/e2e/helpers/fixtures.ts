import { eq, inArray, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Role } from "../../../src/authorization/roles";
import {
  accounts,
  departments,
  documents,
  invites,
  organizations,
  processDepartments,
  processes,
  sessions,
  users,
  verifications,
} from "../../../src/db";

type TestDb = FastifyInstance["db"];

type CleanupApiE2EStateInput = {
  departmentSlugs?: string[];
  emails?: string[];
  organizationCnpjs?: string[];
  organizationSlugs?: string[];
};

type CreateDepartmentFixtureInput = {
  budgetUnitCode?: string | null;
  name: string;
  organizationId: string;
  responsibleName?: string;
  responsibleRole?: string;
  slug: string;
};

type CreateDocumentFixtureInput = {
  name: string;
  organizationId: string;
  processId: string;
  responsibles?: string[];
  status?: string;
  storageKey: string;
  type?: string;
  updatedAt?: string;
};

type CreateOrganizationFixtureInput = {
  cnpj: string;
  createdByUserId: string;
  name: string;
  slug: string;
};

type CreateProcessFixtureInput = {
  departmentIds: string[];
  externalId?: string | null;
  issuedAt?: string;
  justification?: string;
  object?: string;
  organizationId: string;
  processNumber: string;
  responsibleName?: string;
  status?: string;
  type?: string;
};

type PromoteUserToRoleInput = {
  email: string;
  organizationId?: string | null;
  role: Role;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map(normalizeEmail)));
}

function uniqueSlugs(slugs: string[]) {
  return Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean)));
}

function uniqueCnpjs(cnpjs: string[]) {
  return Array.from(new Set(cnpjs.map((cnpj) => cnpj.trim()).filter(Boolean)));
}

export async function cleanupApiE2EState(
  db: TestDb,
  {
    departmentSlugs = [],
    emails = [],
    organizationCnpjs = [],
    organizationSlugs = [],
  }: CleanupApiE2EStateInput,
) {
  const normalizedDepartmentSlugs = uniqueSlugs(departmentSlugs);
  const normalizedCnpjs = uniqueCnpjs(organizationCnpjs);
  const normalizedEmails = uniqueEmails(emails);
  const normalizedSlugs = uniqueSlugs(organizationSlugs);
  const organizationLookupConditions = [];

  if (normalizedSlugs.length > 0) {
    organizationLookupConditions.push(inArray(organizations.slug, normalizedSlugs));
  }

  if (normalizedCnpjs.length > 0) {
    organizationLookupConditions.push(inArray(organizations.cnpj, normalizedCnpjs));
  }

  const existingOrganizations =
    organizationLookupConditions.length === 0
      ? []
      : await db.query.organizations.findMany({
          columns: {
            id: true,
          },
          where:
            organizationLookupConditions.length === 1
              ? organizationLookupConditions[0]
              : or(...organizationLookupConditions),
        });
  const organizationIds = existingOrganizations.map((organization) => organization.id);
  const existingDepartments =
    normalizedDepartmentSlugs.length === 0
      ? []
      : await db.query.departments.findMany({
          columns: {
            id: true,
          },
          where: inArray(departments.slug, normalizedDepartmentSlugs),
        });
  const departmentIds = existingDepartments.map((department) => department.id);

  const existingUsers =
    normalizedEmails.length === 0
      ? []
      : await db.query.users.findMany({
          columns: {
            id: true,
          },
          where: inArray(users.email, normalizedEmails),
        });
  const userIds = existingUsers.map((user) => user.id);

  const inviteConditions = [];

  if (normalizedEmails.length > 0) {
    inviteConditions.push(inArray(invites.email, normalizedEmails));
  }

  if (userIds.length > 0) {
    inviteConditions.push(inArray(invites.invitedByUserId, userIds));
    inviteConditions.push(inArray(invites.acceptedByUserId, userIds));
  }

  if (organizationIds.length > 0) {
    inviteConditions.push(inArray(invites.organizationId, organizationIds));
  }

  if (inviteConditions.length === 1) {
    await db.delete(invites).where(inviteConditions[0]);
  } else if (inviteConditions.length > 1) {
    await db.delete(invites).where(or(...inviteConditions));
  }

  const departmentConditions = [];

  if (departmentIds.length > 0) {
    departmentConditions.push(inArray(departments.id, departmentIds));
  }

  if (organizationIds.length > 0) {
    departmentConditions.push(inArray(departments.organizationId, organizationIds));
  }

  if (departmentConditions.length === 1) {
    await db.delete(departments).where(departmentConditions[0]);
  } else if (departmentConditions.length > 1) {
    await db.delete(departments).where(or(...departmentConditions));
  }

  if (userIds.length > 0) {
    await db.delete(sessions).where(inArray(sessions.userId, userIds));
    await db.delete(accounts).where(inArray(accounts.userId, userIds));
    await db.delete(users).where(inArray(users.id, userIds));
  }

  for (const email of normalizedEmails) {
    await db.delete(verifications).where(eq(verifications.identifier, email));
  }

  if (organizationIds.length > 0) {
    await db.delete(organizations).where(inArray(organizations.id, organizationIds));
  }
}

export async function getUserByEmail(db: TestDb, email: string) {
  return db.query.users.findFirst({
    where: (table, { eq: equals }) => equals(table.email, normalizeEmail(email)),
  });
}

export async function getOrganizationById(db: TestDb, organizationId: string) {
  return db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.id, organizationId),
  });
}

export async function getOrganizationBySlug(db: TestDb, slug: string) {
  return db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.slug, slug.trim()),
  });
}

export async function getDepartmentById(db: TestDb, departmentId: string) {
  return db.query.departments.findFirst({
    where: (table, { eq: equals }) => equals(table.id, departmentId),
  });
}

export async function getDepartmentBySlug(db: TestDb, slug: string) {
  return db.query.departments.findFirst({
    where: (table, { eq: equals }) => equals(table.slug, slug.trim()),
  });
}

export async function getProcessById(db: TestDb, processId: string) {
  return db.query.processes.findFirst({
    where: (table, { eq: equals }) => equals(table.id, processId),
  });
}

export async function getDocumentById(db: TestDb, documentId: string) {
  return db.query.documents.findFirst({
    where: (table, { eq: equals }) => equals(table.id, documentId),
  });
}

export async function getProcessDepartmentIds(db: TestDb, processId: string) {
  const rows = await db
    .select({
      departmentId: processDepartments.departmentId,
    })
    .from(processDepartments)
    .where(eq(processDepartments.processId, processId));

  return rows.map((row) => row.departmentId).sort();
}

export async function promoteUserToRole(
  db: TestDb,
  { email, organizationId = null, role }: PromoteUserToRoleInput,
) {
  const [updatedUser] = await db
    .update(users)
    .set({
      role,
      organizationId,
      updatedAt: new Date(),
    })
    .where(eq(users.email, normalizeEmail(email)))
    .returning();

  if (!updatedUser) {
    throw new Error(`Expected fixture user ${normalizeEmail(email)} to exist.`);
  }

  return updatedUser;
}

export async function createOrganizationFixture(
  db: TestDb,
  { cnpj, createdByUserId, name, slug }: CreateOrganizationFixtureInput,
) {
  const [organization] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      officialName: `${name} Oficial`,
      cnpj,
      city: "Fortaleza",
      state: "CE",
      address: `${name} - Endereco de teste`,
      zipCode: "60000-000",
      phone: "+55 85 99999-0000",
      institutionalEmail: `${slug}@licitadoc.test`,
      website: `https://${slug}.example.com`,
      authorityName: "Responsavel de Teste",
      authorityRole: "Administrador",
      isActive: true,
      createdByUserId,
    })
    .returning();

  if (!organization) {
    throw new Error(`Expected organization fixture ${slug} to be created.`);
  }

  return organization;
}

export async function createDepartmentFixture(
  db: TestDb,
  {
    budgetUnitCode = null,
    name,
    organizationId,
    responsibleName = "Responsavel de Teste",
    responsibleRole = "Secretaria",
    slug,
  }: CreateDepartmentFixtureInput,
) {
  const [department] = await db
    .insert(departments)
    .values({
      name,
      budgetUnitCode,
      organizationId,
      responsibleName,
      responsibleRole,
      slug,
    })
    .returning();

  if (!department) {
    throw new Error(`Expected department fixture ${slug} to be created.`);
  }

  return department;
}

export async function createProcessFixture(
  db: TestDb,
  {
    departmentIds,
    externalId = null,
    issuedAt = "2026-01-08T00:00:00.000Z",
    justification = "Justificativa de teste",
    object = "Objeto de teste",
    organizationId,
    processNumber,
    responsibleName = "Responsavel de Teste",
    status = "draft",
    type = "pregao",
  }: CreateProcessFixtureInput,
) {
  const [process] = await db
    .insert(processes)
    .values({
      organizationId,
      type,
      processNumber,
      externalId,
      issuedAt: new Date(issuedAt),
      object,
      justification,
      responsibleName,
      status,
    })
    .returning();

  if (!process) {
    throw new Error(`Expected process fixture ${processNumber} to be created.`);
  }

  await db.insert(processDepartments).values(
    departmentIds.map((departmentId) => ({
      processId: process.id,
      departmentId,
    })),
  );

  return process;
}

export async function createDocumentFixture(
  db: TestDb,
  {
    name,
    organizationId,
    processId,
    responsibles = ["Responsavel de Teste"],
    status = "completed",
    storageKey,
    type = "attachment",
    updatedAt,
  }: CreateDocumentFixtureInput,
) {
  const [document] = await db
    .insert(documents)
    .values({
      organizationId,
      processId,
      name,
      status,
      storageKey,
      type,
      ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
      responsibles,
    })
    .returning();

  if (!document) {
    throw new Error(`Expected document fixture ${name} to be created.`);
  }

  return document;
}
