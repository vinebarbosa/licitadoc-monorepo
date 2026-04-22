import { afterAll, assert, beforeAll, beforeEach, describe, test } from "vitest";
import { DEFAULT_E2E_PASSWORD, getSession, signIn, signOut, signUp } from "../e2e/helpers/auth";
import { CookieJar } from "../e2e/helpers/cookie-jar";
import { cleanupApiE2EState } from "../e2e/helpers/fixtures";
import { readJson, request } from "../e2e/helpers/http";
import { API_E2E_TEST_EMAILS } from "../e2e/helpers/known-fixtures";
import {
  type ApiTestServer,
  getListeningOrigin,
  startTestServer,
} from "../e2e/helpers/test-server";

const SIGN_UP_EMAIL = "auth-e2e-sign-up@licitadoc.test";
const INVALID_SIGN_IN_EMAIL = "auth-e2e-invalid-sign-in@licitadoc.test";

let server: ApiTestServer;

beforeAll(async () => {
  server = await startTestServer();
  assert.equal(getListeningOrigin(server.app), server.baseUrl);
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

beforeEach(async () => {
  await cleanupApiE2EState(server.app.db, { emails: [...API_E2E_TEST_EMAILS] });
});

describe("auth E2E coverage", () => {
  test("sign-up auto-signs in, reuses the session, reaches a protected route, and signs out", async () => {
    const cookieJar = new CookieJar();

    const { body: signUpBody, response: signUpResponse } = await signUp(server, {
      cookieJar,
      email: SIGN_UP_EMAIL,
      name: "Auth E2E User",
      password: DEFAULT_E2E_PASSWORD,
    });

    assert.equal(signUpResponse.status, 200);
    assert.equal(cookieJar.has("better-auth.session_token"), true);
    assert.ok(signUpBody);

    assert.equal(signUpBody.user.email, SIGN_UP_EMAIL);
    assert.equal(signUpBody.user.name, "Auth E2E User");
    assert.equal(signUpBody.user.role, "member");
    assert.equal(typeof signUpBody.token, "string");

    const { body: sessionBody, response: sessionResponse } = await getSession(server, {
      cookieJar,
    });

    assert.equal(sessionResponse.status, 200);
    assert.ok(sessionBody);
    assert.equal(sessionBody.user.email, SIGN_UP_EMAIL);
    assert.equal(sessionBody.user.role, "member");
    assert.equal(typeof sessionBody.session.userId, "string");

    const protectedResponse = await request(server, "/api/departments/", {
      cookieJar,
    });
    const protectedBody = await readJson<{
      items: unknown[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }>(protectedResponse);

    assert.equal(protectedResponse.status, 200);
    assert.deepEqual(protectedBody, {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });

    const { response: signOutResponse } = await signOut(server, {
      cookieJar,
    });

    assert.equal(signOutResponse.status, 200);
    assert.equal(cookieJar.has("better-auth.session_token"), false);

    const { response: sessionAfterSignOutResponse } = await getSession(server, {
      cookieJar,
    });

    assert.equal(sessionAfterSignOutResponse.status, 200);
    assert.equal(await readJson(sessionAfterSignOutResponse), null);

    const protectedAfterSignOutResponse = await request(server, "/api/departments/", {
      cookieJar,
    });

    assert.equal(protectedAfterSignOutResponse.status, 401);
    assert.deepEqual(await readJson(protectedAfterSignOutResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });
  });

  test("rejects unauthenticated protected requests and invalid credentials", async () => {
    const anonymousProtectedResponse = await request(server, "/api/departments/");

    assert.equal(anonymousProtectedResponse.status, 401);
    assert.deepEqual(await readJson(anonymousProtectedResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const existingUserJar = new CookieJar();
    const { response: existingUserResponse } = await signUp(server, {
      cookieJar: existingUserJar,
      email: INVALID_SIGN_IN_EMAIL,
      name: "Existing Auth User",
      password: DEFAULT_E2E_PASSWORD,
    });

    assert.equal(existingUserResponse.status, 200);

    const invalidCredentialsJar = new CookieJar();
    const { body: invalidCredentialsBody, response: invalidCredentialsResponse } = await signIn(
      server,
      {
        cookieJar: invalidCredentialsJar,
        email: INVALID_SIGN_IN_EMAIL,
        password: "wrong-password",
      },
    );

    assert.equal(invalidCredentialsResponse.status, 401);
    assert.equal(invalidCredentialsJar.has("better-auth.session_token"), false);
    assert.ok(invalidCredentialsBody);
    assert.equal(typeof (invalidCredentialsBody as { message?: string } | null)?.message, "string");

    const { response: invalidSessionResponse } = await getSession(server, {
      cookieJar: invalidCredentialsJar,
    });

    assert.equal(invalidSessionResponse.status, 200);
    assert.equal(await readJson(invalidSessionResponse), null);
  });
});
