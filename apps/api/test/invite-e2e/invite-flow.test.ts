import { afterAll, assert, beforeAll, beforeEach, describe, test } from "vitest";
import {
  type AuthSessionResponse,
  DEFAULT_E2E_PASSWORD,
  signIn,
  signUp,
} from "../e2e/helpers/auth";
import {
  cleanupApiE2EState,
  createOrganizationFixture,
  getUserByEmail,
  promoteUserToRole,
} from "../e2e/helpers/fixtures";
import { readJson, request } from "../e2e/helpers/http";
import {
  API_E2E_TEST_EMAILS,
  API_E2E_TEST_ORGANIZATION_SLUGS,
} from "../e2e/helpers/known-fixtures";
import {
  type ApiTestServer,
  getListeningOrigin,
  startTestServer,
} from "../e2e/helpers/test-server";

const ADMIN_EMAIL = "invite-e2e-admin@licitadoc.test";
const OWNER_EMAIL = "invite-e2e-owner@licitadoc.test";
const MEMBER_EMAIL = "invite-e2e-member@licitadoc.test";
const OTHER_USER_EMAIL = "invite-e2e-other-user@licitadoc.test";
const ADMIN_TARGET_EMAIL = "invite-e2e-admin-target@licitadoc.test";
const OWNER_TARGET_EMAIL = "invite-e2e-owner-target@licitadoc.test";
const PREVIEW_TARGET_EMAIL = "invite-e2e-preview-target@licitadoc.test";
const ACCEPT_TARGET_EMAIL = "invite-e2e-accept-target@licitadoc.test";
const MISMATCH_TARGET_EMAIL = "invite-e2e-mismatch-target@licitadoc.test";
const UNAUTHORIZED_TARGET_EMAIL = "invite-e2e-unauthorized-target@licitadoc.test";
const OUTSIDE_SCOPE_TARGET_EMAIL = "invite-e2e-outside-scope-target@licitadoc.test";

const ADMIN_ORG_SLUG = "invite-e2e-admin-org";
const OWNER_ORG_SLUG = "invite-e2e-owner-org";
const OUTSIDE_SCOPE_ORG_SLUG = "invite-e2e-outside-scope-org";

type InviteResponse = {
  acceptedAt: string | null;
  acceptedByUserId: string | null;
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  invitedByUserId: string | null;
  organizationId: string | null;
  role: "organization_owner" | "member";
  status: "pending" | "accepted" | "revoked";
  updatedAt: string;
};

type InviteWithTokenResponse = InviteResponse & {
  inviteUrl: string;
  token: string;
};

type InvitePreviewResponse = {
  email: string;
  expiresAt: string;
  id: string;
  isExpired: boolean;
  organizationId: string | null;
  role: "organization_owner" | "member";
  status: "pending" | "accepted" | "revoked";
};

type PaginatedInvitesResponse = {
  items: InviteResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ErrorResponse = {
  details: unknown;
  error: string;
  message: string;
};

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
  await cleanupApiE2EState(server.app.db, {
    emails: [...API_E2E_TEST_EMAILS],
    organizationSlugs: [...API_E2E_TEST_ORGANIZATION_SLUGS],
  });
});

async function createUserAccount(email: string, name: string) {
  const { response } = await signUp(server, {
    email,
    name,
    password: DEFAULT_E2E_PASSWORD,
  });

  assert.equal(response.status, 200);

  const user = await getUserByEmail(server.app.db, email);

  assert.ok(user);

  return user;
}

async function signInUser(email: string) {
  const { cookieJar, response } = await signIn(server, {
    email,
    password: DEFAULT_E2E_PASSWORD,
  });

  assert.equal(response.status, 200);
  assert.equal(cookieJar.has("better-auth.session_token"), true);

  const sessionResponse = await request(server, "/api/auth/get-session", {
    cookieJar,
  });
  const sessionBody = await readJson<AuthSessionResponse>(sessionResponse);

  assert.equal(sessionResponse.status, 200);
  assert.ok(sessionBody);
  assert.equal(sessionBody.user.email, email);

  return {
    cookieJar,
    session: sessionBody,
  };
}

async function createAdminActor() {
  await createUserAccount(ADMIN_EMAIL, "Invite Admin");

  await promoteUserToRole(server.app.db, {
    email: ADMIN_EMAIL,
    role: "admin",
  });

  const signedIn = await signInUser(ADMIN_EMAIL);
  const updatedUser = await getUserByEmail(server.app.db, ADMIN_EMAIL);

  assert.ok(updatedUser);

  return {
    cookieJar: signedIn.cookieJar,
    session: signedIn.session,
    user: updatedUser,
  };
}

async function createOrganizationOwnerActor() {
  const user = await createUserAccount(OWNER_EMAIL, "Invite Owner");
  const organization = await createOrganizationFixture(server.app.db, {
    cnpj: "11111111111111",
    createdByUserId: user.id,
    name: "Invite Owner Org",
    slug: OWNER_ORG_SLUG,
  });

  await promoteUserToRole(server.app.db, {
    email: OWNER_EMAIL,
    organizationId: organization.id,
    role: "organization_owner",
  });

  const signedIn = await signInUser(OWNER_EMAIL);
  const updatedUser = await getUserByEmail(server.app.db, OWNER_EMAIL);

  assert.ok(updatedUser);

  return {
    cookieJar: signedIn.cookieJar,
    organization,
    session: signedIn.session,
    user: updatedUser,
  };
}

describe("invite E2E coverage", () => {
  test("admin creates an organization owner invite and sees it in the list", async () => {
    const admin = await createAdminActor();
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "22222222222222",
      createdByUserId: admin.user.id,
      name: "Invite Admin Org",
      slug: ADMIN_ORG_SLUG,
    });

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: ADMIN_TARGET_EMAIL,
        organizationId: organization.id,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);
    assert.equal(createdInvite.email, ADMIN_TARGET_EMAIL);
    assert.equal(createdInvite.role, "organization_owner");
    assert.equal(createdInvite.organizationId, organization.id);
    assert.equal(createdInvite.status, "pending");
    assert.equal(createdInvite.invitedByUserId, admin.user.id);
    assert.equal(createdInvite.acceptedByUserId, null);
    assert.equal(createdInvite.inviteUrl, `${server.baseUrl}/invites/${createdInvite.token}`);

    const listResponse = await request(server, "/api/invites/", {
      cookieJar: admin.cookieJar,
    });
    const listBody = await readJson<PaginatedInvitesResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.total, 1);
    assert.equal(listBody.totalPages, 1);
    assert.equal(listBody.items.length, 1);
    assert.equal(listBody.items[0]?.id, createdInvite.id);
    assert.equal(listBody.items[0]?.role, "organization_owner");
    assert.equal(listBody.items[0]?.organizationId, organization.id);
  });

  test("organization owner creates a member invite and only sees invites in their organization scope", async () => {
    const owner = await createOrganizationOwnerActor();
    const admin = await createAdminActor();
    const outsideScopeOrganization = await createOrganizationFixture(server.app.db, {
      cnpj: "33333333333333",
      createdByUserId: admin.user.id,
      name: "Invite Outside Scope Org",
      slug: OUTSIDE_SCOPE_ORG_SLUG,
    });

    const ownerCreateResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        email: OWNER_TARGET_EMAIL,
      },
    });
    const ownerInvite = await readJson<InviteWithTokenResponse>(ownerCreateResponse);

    assert.equal(ownerCreateResponse.status, 201);
    assert.ok(ownerInvite);
    assert.equal(ownerInvite.email, OWNER_TARGET_EMAIL);
    assert.equal(ownerInvite.role, "member");
    assert.equal(ownerInvite.organizationId, owner.organization.id);
    assert.equal(ownerInvite.invitedByUserId, owner.user.id);

    const outsideScopeCreateResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: OUTSIDE_SCOPE_TARGET_EMAIL,
        organizationId: outsideScopeOrganization.id,
      },
    });

    assert.equal(outsideScopeCreateResponse.status, 201);

    const listResponse = await request(server, "/api/invites/", {
      cookieJar: owner.cookieJar,
    });
    const listBody = await readJson<PaginatedInvitesResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.equal(listBody.total, 1);
    assert.equal(listBody.totalPages, 1);
    assert.equal(listBody.items.length, 1);
    assert.equal(listBody.items[0]?.id, ownerInvite.id);
    assert.equal(listBody.items[0]?.email, OWNER_TARGET_EMAIL);
    assert.equal(listBody.items[0]?.organizationId, owner.organization.id);
  });

  test("newly created invite tokens can be previewed", async () => {
    const admin = await createAdminActor();
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "44444444444444",
      createdByUserId: admin.user.id,
      name: "Invite Preview Org",
      slug: ADMIN_ORG_SLUG,
    });

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: PREVIEW_TARGET_EMAIL,
        organizationId: organization.id,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);

    const previewResponse = await request(server, `/api/invites/${createdInvite.token}`);
    const previewBody = await readJson<InvitePreviewResponse>(previewResponse);

    assert.equal(previewResponse.status, 200);
    assert.ok(previewBody);
    assert.equal(previewBody.id, createdInvite.id);
    assert.equal(previewBody.email, PREVIEW_TARGET_EMAIL);
    assert.equal(previewBody.role, "organization_owner");
    assert.equal(previewBody.organizationId, organization.id);
    assert.equal(previewBody.status, "pending");
    assert.equal(previewBody.isExpired, false);
    assert.equal(typeof previewBody.expiresAt, "string");
  });

  test("matching authenticated users accept invites and receive the stored role and organization", async () => {
    const admin = await createAdminActor();
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "55555555555555",
      createdByUserId: admin.user.id,
      name: "Invite Accept Org",
      slug: ADMIN_ORG_SLUG,
    });

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: ACCEPT_TARGET_EMAIL,
        organizationId: organization.id,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);

    const invitedUser = await createUserAccount(ACCEPT_TARGET_EMAIL, "Accepted Invite User");
    const invitee = await signInUser(ACCEPT_TARGET_EMAIL);

    const acceptResponse = await request(server, `/api/invites/${createdInvite.token}/accept`, {
      method: "POST",
      cookieJar: invitee.cookieJar,
    });
    const acceptedInvite = await readJson<InviteResponse>(acceptResponse);

    assert.equal(acceptResponse.status, 200);
    assert.ok(acceptedInvite);
    assert.equal(acceptedInvite.id, createdInvite.id);
    assert.equal(acceptedInvite.status, "accepted");
    assert.equal(acceptedInvite.role, "organization_owner");
    assert.equal(acceptedInvite.organizationId, organization.id);
    assert.equal(acceptedInvite.acceptedByUserId, invitedUser.id);
    assert.equal(typeof acceptedInvite.acceptedAt, "string");

    const persistedInvite = await server.app.db.query.invites.findFirst({
      where: (table, { eq }) => eq(table.id, createdInvite.id),
    });
    const updatedUser = await getUserByEmail(server.app.db, ACCEPT_TARGET_EMAIL);

    assert.ok(persistedInvite);
    assert.ok(updatedUser);
    assert.equal(persistedInvite.status, "accepted");
    assert.equal(persistedInvite.acceptedByUserId, invitedUser.id);
    assert.equal(updatedUser.role, "organization_owner");
    assert.equal(updatedUser.organizationId, organization.id);
  });

  test("unauthenticated and unprivileged actors cannot create or list invites", async () => {
    const anonymousCreateResponse = await request(server, "/api/invites/", {
      method: "POST",
      body: {
        email: UNAUTHORIZED_TARGET_EMAIL,
      },
    });

    assert.equal(anonymousCreateResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(anonymousCreateResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    const anonymousListResponse = await request(server, "/api/invites/");

    assert.equal(anonymousListResponse.status, 401);
    assert.deepEqual(await readJson<ErrorResponse>(anonymousListResponse), {
      error: "unauthorized",
      message: "Authentication required.",
      details: null,
    });

    await createUserAccount(MEMBER_EMAIL, "Invite Member");
    const member = await signInUser(MEMBER_EMAIL);

    const memberCreateResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: member.cookieJar,
      body: {
        email: UNAUTHORIZED_TARGET_EMAIL,
      },
    });

    assert.equal(memberCreateResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberCreateResponse), {
      error: "forbidden",
      message: "You do not have permission to create invites.",
      details: null,
    });

    const memberListResponse = await request(server, "/api/invites/", {
      cookieJar: member.cookieJar,
    });

    assert.equal(memberListResponse.status, 403);
    assert.deepEqual(await readJson<ErrorResponse>(memberListResponse), {
      error: "forbidden",
      message: "You do not have permission to list invites.",
      details: null,
    });

    const unauthorizedInvite = await server.app.db.query.invites.findFirst({
      where: (table, { eq }) => eq(table.email, UNAUTHORIZED_TARGET_EMAIL),
    });

    assert.equal(unauthorizedInvite, undefined);
  });

  test("users cannot accept invites sent to a different email address", async () => {
    const admin = await createAdminActor();
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "66666666666666",
      createdByUserId: admin.user.id,
      name: "Invite Mismatch Org",
      slug: ADMIN_ORG_SLUG,
    });

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: MISMATCH_TARGET_EMAIL,
        organizationId: organization.id,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);

    await createUserAccount(OTHER_USER_EMAIL, "Other Invite User");
    const otherUser = await signInUser(OTHER_USER_EMAIL);

    const acceptResponse = await request(server, `/api/invites/${createdInvite.token}/accept`, {
      method: "POST",
      cookieJar: otherUser.cookieJar,
    });

    assert.equal(acceptResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(acceptResponse), {
      error: "bad_request",
      message: "You can only accept invites sent to your own email.",
      details: null,
    });

    const persistedInvite = await server.app.db.query.invites.findFirst({
      where: (table, { eq }) => eq(table.id, createdInvite.id),
    });
    const persistedOtherUser = await getUserByEmail(server.app.db, OTHER_USER_EMAIL);

    assert.ok(persistedInvite);
    assert.ok(persistedOtherUser);
    assert.equal(persistedInvite.status, "pending");
    assert.equal(persistedInvite.acceptedByUserId, null);
    assert.equal(persistedOtherUser.role, "member");
    assert.equal(persistedOtherUser.organizationId, null);
  });
});
