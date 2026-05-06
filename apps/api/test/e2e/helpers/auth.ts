import { CookieJar } from "./cookie-jar";
import { readJson, request } from "./http";
import type { ApiTestServer } from "./test-server";

export const DEFAULT_E2E_PASSWORD = "P@ssword123!";

export type AuthUserResponse = {
  email: string;
  name: string;
  onboardingStatus?: string | null;
  role: string;
  organizationId?: string | null;
};

export type AuthEmailResponse = {
  token: string | null;
  user: AuthUserResponse;
};

export type AuthSessionResponse = {
  session: {
    userId: string;
  };
  user: {
    email: string;
    onboardingStatus?: string | null;
    role: string;
    organizationId?: string | null;
  };
} | null;

type SignUpInput = {
  cookieJar?: CookieJar;
  email: string;
  name: string;
  password?: string;
};

type SignInInput = {
  cookieJar?: CookieJar;
  email: string;
  password?: string;
};

type SignOutInput = {
  cookieJar: CookieJar;
};

type GetSessionInput = {
  cookieJar?: CookieJar;
};

export async function signUp(
  server: ApiTestServer,
  { cookieJar = new CookieJar(), email, name, password = DEFAULT_E2E_PASSWORD }: SignUpInput,
) {
  const response = await request(server, "/api/auth/sign-up/email", {
    method: "POST",
    cookieJar,
    body: {
      email,
      name,
      password,
    },
  });

  return {
    response,
    body: await readJson<AuthEmailResponse>(response.clone()),
    cookieJar,
  };
}

export async function signIn(
  server: ApiTestServer,
  { cookieJar = new CookieJar(), email, password = DEFAULT_E2E_PASSWORD }: SignInInput,
) {
  const response = await request(server, "/api/auth/sign-in/email", {
    method: "POST",
    cookieJar,
    body: {
      email,
      password,
    },
  });

  return {
    response,
    body: await readJson<unknown>(response.clone()),
    cookieJar,
  };
}

export async function signOut(server: ApiTestServer, { cookieJar }: SignOutInput) {
  const response = await request(server, "/api/auth/sign-out", {
    method: "POST",
    cookieJar,
    body: {},
  });

  return {
    response,
    body: await readJson<unknown>(response.clone()),
    cookieJar,
  };
}

export async function getSession(server: ApiTestServer, { cookieJar }: GetSessionInput = {}) {
  const response = await request(server, "/api/auth/get-session", {
    cookieJar,
  });

  return {
    response,
    body: await readJson<AuthSessionResponse>(response.clone()),
  };
}
