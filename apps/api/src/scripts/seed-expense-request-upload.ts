import { eq } from "drizzle-orm";
import { buildApp } from "../app/build-app";
import { accounts, sessions, users, verifications } from "../db/schema/auth";
import { organizations } from "../db/schema/organizations";
import { departments as departmentsTable } from "../db/schema/departments";

const FIXTURE = {
  user: {
    email: "expense-request-upload-owner@licitadoc.local",
    name: "Expense Request Upload Owner",
    password: "P@ssword123!",
  },
  organization: {
    address: "Praca 05 de Abril, 180, Centro",
    authorityName: "Autoridade de Teste de Pureza",
    authorityRole: "Gestor Municipal",
    city: "Pureza",
    cnpj: "08.290.223/0001-42",
    institutionalEmail: "expense-request-upload-pureza@licitadoc.local",
    name: "Municipio de Pureza",
    officialName: "Municipio de Pureza/RN",
    phone: "(84) 3000-0000",
    slug: "expense-request-upload-pureza",
    state: "RN",
    zipCode: "59582-000",
  },
  department: {
    budgetUnitCode: "06.001",
    name: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
    responsibleName: "Maria Marilda Silva da Rocha",
    responsibleRole: "SECRETARIO DE EDUCACAO, CULTURA, ESPORTE E LAZER",
    slug: "expense-request-upload-educ-cultura-esporte-lazer",
  },
} as const;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAuthHost(app: Awaited<ReturnType<typeof buildApp>>) {
  return new URL(app.config.BETTER_AUTH_URL).host;
}

async function getFixtureUser(app: Awaited<ReturnType<typeof buildApp>>) {
  const email = normalizeEmail(FIXTURE.user.email);

  return app.db.query.users.findFirst({
    where: (table, { eq: equals }) => equals(table.email, email),
  });
}

async function signInWithFixtureCredentials(app: Awaited<ReturnType<typeof buildApp>>) {
  try {
    await app.auth.api.signInEmail({
      body: {
        email: normalizeEmail(FIXTURE.user.email),
        password: FIXTURE.user.password,
      },
      headers: new Headers({
        host: getAuthHost(app),
      }),
    });

    return true;
  } catch {
    return false;
  }
}

async function ensureFixtureUser(app: Awaited<ReturnType<typeof buildApp>>) {
  const email = normalizeEmail(FIXTURE.user.email);
  const existingUser = await getFixtureUser(app);

  if (existingUser) {
    const canSignIn = await signInWithFixtureCredentials(app);

    if (canSignIn) {
      return existingUser;
    }

    await app.db.delete(sessions).where(eq(sessions.userId, existingUser.id));
    await app.db.delete(accounts).where(eq(accounts.userId, existingUser.id));
    await app.db.delete(users).where(eq(users.id, existingUser.id));
    await app.db.delete(verifications).where(eq(verifications.identifier, email));
  }

  await app.auth.api.signUpEmail({
    body: {
      email,
      name: FIXTURE.user.name,
      password: FIXTURE.user.password,
    },
    headers: new Headers({
      host: getAuthHost(app),
    }),
  });

  const createdUser = await getFixtureUser(app);

  if (!createdUser) {
    throw new Error(`Expected fixture user ${email} to exist after sign-up.`);
  }

  return createdUser;
}

async function upsertOrganization(
  app: Awaited<ReturnType<typeof buildApp>>,
  createdByUserId: string,
) {
  const existingOrganization = await app.db.query.organizations.findFirst({
    where: (table, { eq: equals, or: either }) =>
      either(
        equals(table.cnpj, FIXTURE.organization.cnpj),
        equals(table.slug, FIXTURE.organization.slug),
      ),
  });

  const nextValues = {
    address: FIXTURE.organization.address,
    authorityName: FIXTURE.organization.authorityName,
    authorityRole: FIXTURE.organization.authorityRole,
    city: FIXTURE.organization.city,
    cnpj: FIXTURE.organization.cnpj,
    createdByUserId,
    institutionalEmail: FIXTURE.organization.institutionalEmail,
    isActive: true,
    logoUrl: null,
    name: FIXTURE.organization.name,
    officialName: FIXTURE.organization.officialName,
    phone: FIXTURE.organization.phone,
    slug: FIXTURE.organization.slug,
    state: FIXTURE.organization.state,
    updatedAt: new Date(),
    website: null,
    zipCode: FIXTURE.organization.zipCode,
  };

  if (existingOrganization) {
    const [updatedOrganization] = await app.db
      .update(organizations)
      .set(nextValues)
      .where(eq(organizations.id, existingOrganization.id))
      .returning();

    if (!updatedOrganization) {
      throw new Error("Unable to update expense request upload fixture organization.");
    }

    return updatedOrganization;
  }

  const [createdOrganization] = await app.db
    .insert(organizations)
    .values(nextValues)
    .returning();

  if (!createdOrganization) {
    throw new Error("Unable to create expense request upload fixture organization.");
  }

  return createdOrganization;
}

async function upsertDepartment(
  app: Awaited<ReturnType<typeof buildApp>>,
  organizationId: string,
) {
  const existingDepartment = await app.db.query.departments.findFirst({
    where: (table, { and: both, eq: equals, or: either }) =>
      both(
        equals(table.organizationId, organizationId),
        either(
          equals(table.budgetUnitCode, FIXTURE.department.budgetUnitCode),
          equals(table.slug, FIXTURE.department.slug),
        ),
      ),
  });

  const nextValues = {
    budgetUnitCode: FIXTURE.department.budgetUnitCode,
    name: FIXTURE.department.name,
    organizationId,
    responsibleName: FIXTURE.department.responsibleName,
    responsibleRole: FIXTURE.department.responsibleRole,
    slug: FIXTURE.department.slug,
    updatedAt: new Date(),
  };

  if (existingDepartment) {
    const [updatedDepartment] = await app.db
      .update(departmentsTable)
      .set(nextValues)
      .where(eq(departmentsTable.id, existingDepartment.id))
      .returning();

    if (!updatedDepartment) {
      throw new Error("Unable to update expense request upload fixture department.");
    }

    return updatedDepartment;
  }

  const [createdDepartment] = await app.db
    .insert(departmentsTable)
    .values(nextValues)
    .returning();

  if (!createdDepartment) {
    throw new Error("Unable to create expense request upload fixture department.");
  }

  return createdDepartment;
}

async function promoteFixtureUser(
  app: Awaited<ReturnType<typeof buildApp>>,
  organizationId: string,
) {
  const [updatedUser] = await app.db
    .update(users)
    .set({
      emailVerified: true,
      name: FIXTURE.user.name,
      organizationId,
      role: "organization_owner",
      updatedAt: new Date(),
    })
    .where(eq(users.email, normalizeEmail(FIXTURE.user.email)))
    .returning();

  if (!updatedUser) {
    throw new Error("Unable to promote expense request upload fixture user.");
  }

  await app.db.delete(sessions).where(eq(sessions.userId, updatedUser.id));

  return updatedUser;
}

async function verifyFixtureCredentials(app: Awaited<ReturnType<typeof buildApp>>) {
  await app.auth.api.signInEmail({
    body: {
      email: normalizeEmail(FIXTURE.user.email),
      password: FIXTURE.user.password,
    },
    headers: new Headers({
      host: getAuthHost(app),
    }),
  });
}

function printSummary({
  department,
  organization,
}: {
  department: typeof departmentsTable.$inferSelect;
  organization: typeof organizations.$inferSelect;
}) {
  const baseUrl = "http://localhost:3333";

  console.log("");
  console.log("Expense request upload fixture is ready.");
  console.log("");
  console.log(`User email: ${FIXTURE.user.email}`);
  console.log(`User password: ${FIXTURE.user.password}`);
  console.log("User role: organization_owner");
  console.log(`Organization id: ${organization.id}`);
  console.log(`Organization slug: ${organization.slug}`);
  console.log(`Organization CNPJ: ${organization.cnpj}`);
  console.log(`Department id: ${department.id}`);
  console.log(`Department slug: ${department.slug}`);
  console.log(`Department budget unit: ${department.budgetUnitCode ?? "n/a"}`);
  console.log("");
  console.log("Suggested manual flow:");
  console.log("1. Start the stack: docker compose up -d postgres localstack");
  console.log("2. Run migrations: cd apps/api && pnpm db:migrate");
  console.log("3. Seed fixture: cd apps/api && pnpm seed:expense-request-upload");
  console.log("4. Start the API: cd apps/api && pnpm dev");
  console.log("");
  console.log("Example sign-in request:");
  console.log(
    `curl -i -c /tmp/licitadoc-expense-upload.cookies -X POST ${baseUrl}/api/auth/sign-in/email \\`,
  );
  console.log('  -H "content-type: application/json" \\');
  console.log(
    `  -d '{"email":"${FIXTURE.user.email}","password":"${FIXTURE.user.password}"}'`,
  );
  console.log("");
  console.log("Example PDF upload request:");
  console.log(
    `curl -b /tmp/licitadoc-expense-upload.cookies -X POST ${baseUrl}/api/processes/from-expense-request/pdf \\`,
  );
  console.log('  -F "file=@/absolute/path/to/SD.pdf;type=application/pdf" \\');
  console.log('  -F "sourceLabel=SD.pdf"');
  console.log("");
}

async function main() {
  const app = await buildApp();

  try {
    await app.ready();

    const user = await ensureFixtureUser(app);
    const organization = await upsertOrganization(app, user.id);
    const department = await upsertDepartment(app, organization.id);

    await promoteFixtureUser(app, organization.id);
    await verifyFixtureCredentials(app);

    printSummary({ department, organization });
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
