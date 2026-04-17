import { eq } from "drizzle-orm";
import { buildApp } from "../app/build-app";
import { users } from "../db/schema/auth";

function readOption(name: string) {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));

  if (!argument) {
    return undefined;
  }

  return argument.slice(prefix.length);
}

function readRequiredInput(name: string, envName: string) {
  const value = readOption(name) ?? process.env[envName];

  if (!value) {
    throw new Error(`Missing ${name}. Provide --${name}=... or set ${envName}.`);
  }

  return value;
}

async function createOrPromoteAdmin() {
  const email = readRequiredInput("email", "ADMIN_EMAIL");
  const password = readRequiredInput("password", "ADMIN_PASSWORD");
  const name = readOption("name") ?? process.env.ADMIN_NAME ?? "Admin";
  const app = await buildApp();

  try {
    await app.ready();

    const [existingUser] = await app.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId = existingUser?.id;

    if (!existingUser) {
      const host = new URL(app.config.BETTER_AUTH_URL).host;
      const result = await app.auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
        },
        headers: new Headers({
          host,
        }),
      });

      userId = result.user.id;
      app.log.info({ email }, "Admin user created through Better Auth.");
    } else {
      app.log.info(
        { email, currentRole: existingUser.role },
        "User already exists. Promoting user to admin.",
      );
    }

    const [adminUser] = await app.db
      .update(users)
      .set({
        role: "admin",
        organizationId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
      });

    if (!adminUser) {
      throw new Error(`Unable to create or promote admin user for ${email}.`);
    }

    app.log.info(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        organizationId: adminUser.organizationId,
      },
      "Admin user is ready.",
    );

    if (!userId) {
      app.log.warn({ email }, "Admin user was updated but no user id was captured.");
    }
  } finally {
    await app.close();
  }
}

createOrPromoteAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
