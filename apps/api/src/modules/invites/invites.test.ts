import assert from "node:assert/strict";
import test from "node:test";
import type { FastifyInstance } from "fastify";
import { type invites, users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { acceptInvite } from "./accept-invite";
import { createInvite } from "./create-invite";
import { getInvites } from "./get-invites";
import { hashInviteToken } from "./invite.tokens";

function createInviteRow(
  overrides: Partial<typeof invites.$inferSelect> = {},
): typeof invites.$inferSelect {
  return {
    id: "7f7ef31b-f8ee-4ad9-8f97-fb9f6054b228",
    email: "owner@example.com",
    role: "organization_owner",
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    invitedByUserId: "admin_user",
    acceptedByUserId: null,
    tokenHash: hashInviteToken("invite-token"),
    status: "pending",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    acceptedAt: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createUserRow(
  overrides: Partial<typeof users.$inferSelect> = {},
): typeof users.$inferSelect {
  return {
    id: "user_123",
    name: "Test User",
    email: "owner@example.com",
    emailVerified: false,
    image: null,
    role: "member",
    organizationId: null,
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("createInvite creates organization owner invites for admins", async () => {
  let insertedValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      invites: {
        findFirst: async () => undefined,
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedValues = values;

        return {
          returning: async () => [
            createInviteRow({
              email: String(values.email),
              role: "organization_owner",
              organizationId: (values.organizationId as string | null) ?? null,
              invitedByUserId: String(values.invitedByUserId),
              tokenHash: String(values.tokenHash),
              expiresAt: values.expiresAt as Date,
            }),
          ],
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const invite = await createInvite({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    baseUrl: "https://app.example.com",
    email: "Owner@Example.com",
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
  });

  assert.equal(invite.role, "organization_owner");
  assert.equal(invite.organizationId, "4fd5b7df-e2e5-4876-b4c3-b35306c6e733");
  assert.equal(invite.email, "owner@example.com");
  assert.match(invite.inviteUrl, /^https:\/\/app\.example\.com\/invites\//);
  assert.equal(insertedValues?.role, "organization_owner");
});

test("createInvite forces member role and inviter organization for organization owners", async () => {
  let insertedValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      invites: {
        findFirst: async () => undefined,
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedValues = values;

        return {
          returning: async () => [
            createInviteRow({
              email: String(values.email),
              role: "member",
              organizationId: String(values.organizationId),
              invitedByUserId: String(values.invitedByUserId),
              tokenHash: String(values.tokenHash),
              expiresAt: values.expiresAt as Date,
            }),
          ],
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const invite = await createInvite({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "org_from_actor",
    },
    db,
    baseUrl: "https://app.example.com/",
    email: "member@example.com",
    organizationId: "ignored_org",
  });

  assert.equal(invite.role, "member");
  assert.equal(invite.organizationId, "org_from_actor");
  assert.equal(insertedValues?.organizationId, "org_from_actor");
});

test("getInvites returns only organization-scoped rows for organization owners", async () => {
  let findManyCalls = 0;
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;
  let countWhereCalled = 0;

  const db = {
    select: () => ({
      from: () => ({
        where: async () => {
          countWhereCalled += 1;
          return [{ total: 1 }];
        },
      }),
    }),
    query: {
      invites: {
        findMany: async (options?: { limit?: number; offset?: number }) => {
          findManyCalls += 1;
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [createInviteRow({ organizationId: "org_1", role: "member" })];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getInvites({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "org_1",
    },
    db,
  });

  assert.equal(findManyCalls, 1);
  assert.equal(countWhereCalled, 1);
  assert.equal(capturedLimit, 20);
  assert.equal(capturedOffset, 0);
  assert.equal(response.items.length, 1);
  assert.equal(response.items[0]?.organizationId, "org_1");
  assert.equal(response.items[0]?.role, "member");
  assert.equal(response.page, 1);
  assert.equal(response.pageSize, 20);
  assert.equal(response.total, 1);
  assert.equal(response.totalPages, 1);
});

test("getInvites applies explicit pagination and total pages for admins", async () => {
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;

  const db = {
    select: () => ({
      from: () => ({
        where: async () => [{ total: 5 }],
      }),
    }),
    query: {
      invites: {
        findMany: async (options?: { limit?: number; offset?: number }) => {
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [createInviteRow({ role: "member" })];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getInvites({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    page: 2,
    pageSize: 2,
  });

  assert.equal(capturedLimit, 2);
  assert.equal(capturedOffset, 2);
  assert.equal(response.page, 2);
  assert.equal(response.pageSize, 2);
  assert.equal(response.total, 5);
  assert.equal(response.totalPages, 3);
});

test("getInvites returns an empty paginated response when owner has no organization", async () => {
  const db = {} as FastifyInstance["db"];

  const response = await getInvites({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: null,
    },
    db,
    page: 3,
    pageSize: 10,
  });

  assert.deepEqual(response.items, []);
  assert.equal(response.page, 3);
  assert.equal(response.pageSize, 10);
  assert.equal(response.total, 0);
  assert.equal(response.totalPages, 0);
});

test("acceptInvite applies role and organization for a valid invite", async () => {
  const inviteRow = createInviteRow();
  const userRow = createUserRow({ id: "user_123", email: "owner@example.com" });
  let updatedUserPayload: Record<string, unknown> | undefined;

  const tx = {
    query: {
      invites: {
        findFirst: async () => inviteRow,
      },
      users: {
        findFirst: async () => userRow,
      },
    },
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        if (table === users) {
          updatedUserPayload = values;

          return {
            where: async () => undefined,
          };
        }

        return {
          where: () => ({
            returning: async () => [
              createInviteRow({
                ...inviteRow,
                status: "accepted",
                acceptedByUserId: "user_123",
                acceptedAt: new Date("2029-12-15T00:00:00.000Z"),
                updatedAt: new Date("2029-12-15T00:00:00.000Z"),
              }),
            ],
          }),
        };
      },
    }),
  };

  const db = {
    transaction: async (
      callback: (transaction: typeof tx) => Promise<ReturnType<typeof acceptInvite>>,
    ) => callback(tx),
  } as unknown as FastifyInstance["db"];

  const acceptedInvite = await acceptInvite({
    actor: {
      id: "user_123",
      role: "member",
      organizationId: null,
    },
    db,
    inviteToken: "invite-token",
  });

  assert.equal(updatedUserPayload?.role, "organization_owner");
  assert.equal(updatedUserPayload?.organizationId, "4fd5b7df-e2e5-4876-b4c3-b35306c6e733");
  assert.equal(acceptedInvite.status, "accepted");
  assert.equal(acceptedInvite.acceptedByUserId, "user_123");
});

test("acceptInvite rejects expired invites", async () => {
  const tx = {
    query: {
      invites: {
        findFirst: async () =>
          createInviteRow({
            expiresAt: new Date("2000-01-01T00:00:00.000Z"),
          }),
      },
      users: {
        findFirst: async () => createUserRow(),
      },
    },
  };

  const db = {
    transaction: async (
      callback: (transaction: typeof tx) => Promise<ReturnType<typeof acceptInvite>>,
    ) => callback(tx),
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      acceptInvite({
        actor: {
          id: "user_123",
          role: "member",
          organizationId: null,
        },
        db,
        inviteToken: "invite-token",
      }),
    (error: unknown) => error instanceof BadRequestError && error.message === "Invite has expired.",
  );
});

test("acceptInvite rejects email mismatches and spent invites", async (t) => {
  await t.test("email mismatch", async () => {
    const tx = {
      query: {
        invites: {
          findFirst: async () => createInviteRow({ email: "other@example.com" }),
        },
        users: {
          findFirst: async () => createUserRow({ email: "owner@example.com" }),
        },
      },
    };

    const db = {
      transaction: async (
        callback: (transaction: typeof tx) => Promise<ReturnType<typeof acceptInvite>>,
      ) => callback(tx),
    } as unknown as FastifyInstance["db"];

    await assert.rejects(
      () =>
        acceptInvite({
          actor: {
            id: "user_123",
            role: "member",
            organizationId: null,
          },
          db,
          inviteToken: "invite-token",
        }),
      (error: unknown) =>
        error instanceof BadRequestError &&
        error.message === "You can only accept invites sent to your own email.",
    );
  });

  await t.test("invite already spent", async () => {
    const tx = {
      query: {
        invites: {
          findFirst: async () => createInviteRow({ status: "accepted" }),
        },
        users: {
          findFirst: async () => createUserRow(),
        },
      },
    };

    const db = {
      transaction: async (
        callback: (transaction: typeof tx) => Promise<ReturnType<typeof acceptInvite>>,
      ) => callback(tx),
    } as unknown as FastifyInstance["db"];

    await assert.rejects(
      () =>
        acceptInvite({
          actor: {
            id: "user_123",
            role: "member",
            organizationId: null,
          },
          db,
          inviteToken: "invite-token",
        }),
      (error: unknown) =>
        error instanceof BadRequestError && error.message === "Invite is no longer pending.",
    );
  });
});
