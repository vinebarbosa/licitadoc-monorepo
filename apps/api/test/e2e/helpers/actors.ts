import type { organizations, users } from "../../../src/db";
import { type AuthSessionResponse, DEFAULT_E2E_PASSWORD, getSession, signIn, signUp } from "./auth";
import type { CookieJar } from "./cookie-jar";
import { createOrganizationFixture, getUserByEmail, promoteUserToRole } from "./fixtures";
import type { ApiTestServer } from "./test-server";

type StoredOrganization = typeof organizations.$inferSelect;
type StoredUser = typeof users.$inferSelect;

type BaseUserInput = {
  email: string;
  name: string;
  password?: string;
};

type CreateManagedUserInput = BaseUserInput & {
  organizationId?: string | null;
  role?: StoredUser["role"];
};

type CreateOrganizationOwnerActorInput = BaseUserInput & {
  organization: {
    cnpj: string;
    name: string;
    slug: string;
  };
};

export type SignedInTestActor = {
  cookieJar: CookieJar;
  session: Exclude<AuthSessionResponse, null>;
  user: StoredUser;
};

export type OrganizationOwnerTestActor = SignedInTestActor & {
  organization: StoredOrganization;
};

export async function createUserAccount(
  server: ApiTestServer,
  { email, name, password = DEFAULT_E2E_PASSWORD }: BaseUserInput,
) {
  const { response } = await signUp(server, {
    email,
    name,
    password,
  });

  if (response.status !== 200) {
    throw new Error(`Expected sign-up for ${email} to succeed, got ${response.status}.`);
  }

  const user = await getUserByEmail(server.app.db, email);

  if (!user) {
    throw new Error(`Expected fixture user ${email} to exist after sign-up.`);
  }

  return user;
}

export async function signInUser(
  server: ApiTestServer,
  { email, password = DEFAULT_E2E_PASSWORD }: Pick<BaseUserInput, "email" | "password">,
) {
  const { body, cookieJar, response } = await signIn(server, {
    email,
    password,
  });

  if (response.status !== 200) {
    throw new Error(`Expected sign-in for ${email} to succeed, got ${response.status}.`);
  }

  if (!cookieJar.has("better-auth.session_token")) {
    throw new Error(`Expected sign-in for ${email} to issue a session cookie.`);
  }

  const { body: session } = await getSession(server, {
    cookieJar,
  });

  if (!session) {
    throw new Error(`Expected sign-in for ${email} to produce an authenticated session.`);
  }

  if (session.user.email !== email) {
    throw new Error(`Expected session email ${session.user.email} to match ${email}.`);
  }

  return {
    cookieJar,
    response,
    session,
    signInBody: body,
  };
}

export async function createManagedUser(
  server: ApiTestServer,
  {
    email,
    name,
    organizationId = null,
    password = DEFAULT_E2E_PASSWORD,
    role = "member",
  }: CreateManagedUserInput,
) {
  await createUserAccount(server, {
    email,
    name,
    password,
  });

  if (role !== "member" || organizationId !== null) {
    await promoteUserToRole(server.app.db, {
      email,
      organizationId,
      role,
    });
  }

  const user = await getUserByEmail(server.app.db, email);

  if (!user) {
    throw new Error(`Expected managed user fixture ${email} to exist.`);
  }

  return user;
}

export async function createAdminActor(
  server: ApiTestServer,
  { email, name, password = DEFAULT_E2E_PASSWORD }: BaseUserInput,
): Promise<SignedInTestActor> {
  await createManagedUser(server, {
    email,
    name,
    password,
    role: "admin",
  });

  const signedIn = await signInUser(server, {
    email,
    password,
  });
  const user = await getUserByEmail(server.app.db, email);

  if (!user) {
    throw new Error(`Expected admin fixture ${email} to exist.`);
  }

  return {
    cookieJar: signedIn.cookieJar,
    session: signedIn.session,
    user,
  };
}

export async function createMemberActor(
  server: ApiTestServer,
  { email, name, organizationId = null, password = DEFAULT_E2E_PASSWORD }: CreateManagedUserInput,
): Promise<SignedInTestActor> {
  await createManagedUser(server, {
    email,
    name,
    organizationId,
    password,
    role: "member",
  });

  const signedIn = await signInUser(server, {
    email,
    password,
  });
  const user = await getUserByEmail(server.app.db, email);

  if (!user) {
    throw new Error(`Expected member fixture ${email} to exist.`);
  }

  return {
    cookieJar: signedIn.cookieJar,
    session: signedIn.session,
    user,
  };
}

export async function createOrganizationOwnerActor(
  server: ApiTestServer,
  { email, name, organization, password = DEFAULT_E2E_PASSWORD }: CreateOrganizationOwnerActorInput,
): Promise<OrganizationOwnerTestActor> {
  const user = await createUserAccount(server, {
    email,
    name,
    password,
  });
  const createdOrganization = await createOrganizationFixture(server.app.db, {
    cnpj: organization.cnpj,
    createdByUserId: user.id,
    name: organization.name,
    slug: organization.slug,
  });

  await promoteUserToRole(server.app.db, {
    email,
    organizationId: createdOrganization.id,
    role: "organization_owner",
  });

  const signedIn = await signInUser(server, {
    email,
    password,
  });
  const updatedUser = await getUserByEmail(server.app.db, email);

  if (!updatedUser) {
    throw new Error(`Expected organization owner fixture ${email} to exist.`);
  }

  return {
    cookieJar: signedIn.cookieJar,
    organization: createdOrganization,
    session: signedIn.session,
    user: updatedUser,
  };
}

export async function createOrganizationOwnerWithoutOrganizationActor(
  server: ApiTestServer,
  { email, name, password = DEFAULT_E2E_PASSWORD }: BaseUserInput,
): Promise<SignedInTestActor> {
  await createManagedUser(server, {
    email,
    name,
    password,
    role: "organization_owner",
  });

  const signedIn = await signInUser(server, {
    email,
    password,
  });
  const user = await getUserByEmail(server.app.db, email);

  if (!user) {
    throw new Error(`Expected organization owner fixture ${email} to exist.`);
  }

  return {
    cookieJar: signedIn.cookieJar,
    session: signedIn.session,
    user,
  };
}
