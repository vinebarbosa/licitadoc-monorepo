import { afterAll, assert, beforeAll, beforeEach, describe, test } from "vitest";
import { InviteEmailDeliveryError, StubInviteMailer } from "../../src/shared/email/invite-mailer";
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
const DELIVERY_FAILURE_TARGET_EMAIL = "invite-e2e-delivery-failure-target@licitadoc.test";

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
  provisionedUserId: string | null;
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
  provisionedUserId: string | null;
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

type PaginatedUsersResponse = {
  items: UserResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ErrorResponse = {
  details?: unknown;
  error: string;
  message: string;
};

type UserResponse = {
  email: string;
  id: string;
  name: string;
  onboardingStatus: "pending_profile" | "pending_organization" | "complete";
  organizationId: string | null;
  role: "admin" | "organization_owner" | "member";
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
  getStubMailer().clear();
});

function getStubMailer() {
  assert.ok(server.app.mailer instanceof StubInviteMailer);

  return server.app.mailer;
}

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
    assert.equal(createdInvite.organizationId, null);
    assert.equal(typeof createdInvite.provisionedUserId, "string");
    assert.equal(createdInvite.status, "pending");
    assert.equal(createdInvite.invitedByUserId, admin.user.id);
    assert.equal(createdInvite.acceptedByUserId, null);
    assert.equal(createdInvite.inviteUrl, `${server.baseUrl}/invites/${createdInvite.token}`);

    const deliveries = getStubMailer().deliveries;
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0]?.to, ADMIN_TARGET_EMAIL);
    assert.equal(deliveries[0]?.inviteId, createdInvite.id);
    assert.equal(deliveries[0]?.inviteUrl, createdInvite.inviteUrl);
    assert.equal(deliveries[0]?.role, "organization_owner");
    assert.equal(deliveries[0]?.signInUrl, `${server.baseUrl}/entrar`);
    assert.equal(typeof deliveries[0]?.temporaryPassword, "string");

    const provisionedUser = await getUserByEmail(server.app.db, ADMIN_TARGET_EMAIL);

    assert.ok(provisionedUser);
    assert.equal(provisionedUser.id, createdInvite.provisionedUserId);
    assert.equal(provisionedUser.role, "organization_owner");
    assert.equal(provisionedUser.organizationId, null);
    assert.equal(provisionedUser.onboardingStatus, "pending_profile");

    const listResponse = await request(server, "/api/invites/", {
      cookieJar: admin.cookieJar,
    });
    const listBody = await readJson<PaginatedInvitesResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody);
    assert.ok(listBody.total >= 1);

    const listedInvite = listBody.items.find((item) => item.id === createdInvite.id);

    assert.ok(listedInvite);
    assert.equal(listedInvite.role, "organization_owner");
    assert.equal(listedInvite.organizationId, null);
    assert.equal(listedInvite.provisionedUserId, createdInvite.provisionedUserId);
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

    const membersResponse = await request(server, "/api/users/?role=member&page=1&pageSize=20", {
      cookieJar: owner.cookieJar,
    });
    const membersBody = await readJson<PaginatedUsersResponse>(membersResponse);

    assert.equal(membersResponse.status, 200);
    assert.ok(membersBody);

    const provisionedMember = membersBody.items.find((item) => item.email === OWNER_TARGET_EMAIL);

    assert.ok(provisionedMember);
    assert.equal(provisionedMember.id, ownerInvite.provisionedUserId);
    assert.equal(provisionedMember.role, "member");
    assert.equal(provisionedMember.organizationId, owner.organization.id);
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
    assert.equal(previewBody.organizationId, null);
    assert.equal(previewBody.status, "pending");
    assert.equal(previewBody.isExpired, false);
    assert.equal(typeof previewBody.expiresAt, "string");
  });

  test("invite delivery failures return normalized server errors without leaking provider details", async () => {
    const admin = await createAdminActor();
    const organization = await createOrganizationFixture(server.app.db, {
      cnpj: "77777777777777",
      createdByUserId: admin.user.id,
      name: "Invite Delivery Failure Org",
      slug: ADMIN_ORG_SLUG,
    });

    getStubMailer().failNextDelivery(new InviteEmailDeliveryError("stub provider secret detail"));

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: DELIVERY_FAILURE_TARGET_EMAIL,
        organizationId: organization.id,
      },
    });

    assert.equal(createResponse.status, 500);
    assert.deepEqual(await readJson<ErrorResponse>(createResponse), {
      error: "internal_server_error",
      message: "An unexpected error occurred.",
    });

    const persistedInvite = await server.app.db.query.invites.findFirst({
      where: (table, { eq }) => eq(table.email, DELIVERY_FAILURE_TARGET_EMAIL),
    });

    assert.ok(persistedInvite);
    assert.equal(persistedInvite.status, "pending");
    assert.equal(getStubMailer().deliveries.length, 0);
  });

  test("invited organization owners sign in with the temporary password and complete onboarding", async () => {
    const admin = await createAdminActor();

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: admin.cookieJar,
      body: {
        email: ADMIN_TARGET_EMAIL,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);

    const temporaryPassword = getStubMailer().deliveries[0]?.temporaryPassword;

    assert.equal(typeof temporaryPassword, "string");

    const signedIn = await signIn(server, {
      email: ADMIN_TARGET_EMAIL,
      password: temporaryPassword,
    });

    assert.equal(signedIn.response.status, 200);

    const profileResponse = await request(server, "/api/users/me/onboarding/profile", {
      method: "POST",
      cookieJar: signedIn.cookieJar,
      body: {
        name: "Owner Onboarding User",
        password: "N0vaSenhaSegura!",
      },
    });
    const profileBody = await readJson<UserResponse>(profileResponse);

    assert.equal(profileResponse.status, 200);
    assert.ok(profileBody);
    assert.equal(profileBody.email, ADMIN_TARGET_EMAIL);
    assert.equal(profileBody.onboardingStatus, "pending_organization");
    assert.equal(profileBody.organizationId, null);

    const organizationResponse = await request(server, "/api/organizations/", {
      method: "POST",
      cookieJar: signedIn.cookieJar,
      body: {
        name: "Invite Full Onboarding Org",
        slug: "invite-e2e-full-onboarding-org",
        officialName: "Invite Full Onboarding Org Oficial",
        cnpj: "99000000000001",
        city: "Fortaleza",
        state: "CE",
        address: "Rua do Onboarding, 1",
        zipCode: "60000-000",
        phone: "(85) 3333-0000",
        institutionalEmail: "invite-e2e-full-onboarding-org@licitadoc.test",
        website: null,
        logoUrl: null,
        authorityName: "Owner Onboarding User",
        authorityRole: "Prefeita",
      },
    });
    const organizationBody = await readJson<{ id: string }>(organizationResponse);

    assert.equal(organizationResponse.status, 201);
    assert.ok(organizationBody);

    const sessionResponse = await request(server, "/api/auth/get-session", {
      cookieJar: signedIn.cookieJar,
    });
    const sessionBody = await readJson<AuthSessionResponse>(sessionResponse);

    assert.equal(sessionResponse.status, 200);
    assert.ok(sessionBody);
    assert.equal(sessionBody.user.email, ADMIN_TARGET_EMAIL);
    assert.equal(sessionBody.user.onboardingStatus, "complete");
    assert.equal(sessionBody.user.organizationId, organizationBody.id);

    const persistedOwner = await getUserByEmail(server.app.db, ADMIN_TARGET_EMAIL);

    assert.ok(persistedOwner);
    assert.equal(persistedOwner.onboardingStatus, "complete");
    assert.equal(persistedOwner.organizationId, organizationBody.id);
  });

  test("invited members sign in with temporary credentials and complete required onboarding", async () => {
    const owner = await createOrganizationOwnerActor();

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        email: ACCEPT_TARGET_EMAIL,
      },
    });
    const createdInvite = await readJson<InviteWithTokenResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createdInvite);

    const temporaryPassword = getStubMailer().deliveries[0]?.temporaryPassword;

    assert.equal(typeof temporaryPassword, "string");

    const provisionedUser = await getUserByEmail(server.app.db, ACCEPT_TARGET_EMAIL);

    assert.ok(provisionedUser);
    assert.equal(provisionedUser.id, createdInvite.provisionedUserId);
    assert.equal(provisionedUser.role, "member");
    assert.equal(provisionedUser.organizationId, owner.organization.id);
    assert.equal(provisionedUser.onboardingStatus, "pending_profile");
    assert.ok(provisionedUser.temporaryPasswordCreatedAt);
    assert.ok(provisionedUser.temporaryPasswordExpiresAt);

    const signedIn = await signIn(server, {
      email: ACCEPT_TARGET_EMAIL,
      password: temporaryPassword,
    });

    assert.equal(signedIn.response.status, 200);

    const sessionResponse = await request(server, "/api/auth/get-session", {
      cookieJar: signedIn.cookieJar,
    });
    const sessionBody = await readJson<AuthSessionResponse>(sessionResponse);

    assert.equal(sessionResponse.status, 200);
    assert.ok(sessionBody);
    assert.equal(sessionBody.user.email, ACCEPT_TARGET_EMAIL);
    assert.equal(sessionBody.user.role, "member");
    assert.equal(sessionBody.user.organizationId, owner.organization.id);
    assert.equal(sessionBody.user.onboardingStatus, "pending_profile");

    const profileResponse = await request(server, "/api/users/me/onboarding/profile", {
      method: "POST",
      cookieJar: signedIn.cookieJar,
      body: {
        name: "Accepted Invite Member",
        password: "N0vaSenhaSegura!",
      },
    });
    const profileBody = await readJson<UserResponse>(profileResponse);

    assert.equal(profileResponse.status, 200);
    assert.ok(profileBody);
    assert.equal(profileBody.name, "Accepted Invite Member");
    assert.equal(profileBody.role, "member");
    assert.equal(profileBody.organizationId, owner.organization.id);
    assert.equal(profileBody.onboardingStatus, "complete");

    const acceptResponse = await request(server, `/api/invites/${createdInvite.token}/accept`, {
      method: "POST",
      cookieJar: signedIn.cookieJar,
    });

    assert.equal(acceptResponse.status, 400);
    assert.deepEqual(await readJson<ErrorResponse>(acceptResponse), {
      error: "bad_request",
      message: "Member invites must be completed through first-login onboarding.",
      details: null,
    });

    const persistedInvite = await server.app.db.query.invites.findFirst({
      where: (table, { eq }) => eq(table.id, createdInvite.id),
    });
    const completedUser = await getUserByEmail(server.app.db, ACCEPT_TARGET_EMAIL);

    assert.ok(persistedInvite);
    assert.ok(completedUser);
    assert.equal(persistedInvite.status, "pending");
    assert.equal(persistedInvite.acceptedByUserId, null);
    assert.equal(completedUser.role, "member");
    assert.equal(completedUser.organizationId, owner.organization.id);
    assert.equal(completedUser.onboardingStatus, "complete");
    assert.equal(completedUser.temporaryPasswordCreatedAt, null);
    assert.equal(completedUser.temporaryPasswordExpiresAt, null);
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
    const owner = await createOrganizationOwnerActor();

    const createResponse = await request(server, "/api/invites/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        email: MISMATCH_TARGET_EMAIL,
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
