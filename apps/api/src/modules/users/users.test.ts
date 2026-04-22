import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import { test } from "vitest";
import type { users } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { deleteUser } from "./delete-user";
import { getUser } from "./get-user";
import { getUsers } from "./get-users";
import { updateUser } from "./update-user";

function createUserRow(
  overrides: Partial<typeof users.$inferSelect> = {},
): typeof users.$inferSelect {
  return {
    id: "user_123",
    name: "Test User",
    email: "user@example.com",
    emailVerified: false,
    image: null,
    role: "member",
    organizationId: "4fd5b7df-e2e5-4876-b4c3-b35306c6e733",
    createdAt: new Date("2029-12-01T00:00:00.000Z"),
    updatedAt: new Date("2029-12-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("getUsers returns paginated stored users for admins", async () => {
  let capturedLimit: number | undefined;
  let capturedOffset: number | undefined;
  let capturedWhere: unknown;

  const db = {
    select: () => ({
      from: () => ({
        where: async (where: unknown) => {
          capturedWhere = where;
          return [{ total: 5 }];
        },
      }),
    }),
    query: {
      users: {
        findMany: async (options?: { where?: unknown; limit?: number; offset?: number }) => {
          capturedLimit = options?.limit;
          capturedOffset = options?.offset;

          return [
            createUserRow({ id: "admin_1", role: "admin", organizationId: null }),
            createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
          ];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getUsers({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    page: 2,
    pageSize: 2,
  });

  assert.equal(capturedWhere, undefined);
  assert.equal(capturedLimit, 2);
  assert.equal(capturedOffset, 2);
  assert.equal(response.page, 2);
  assert.equal(response.pageSize, 2);
  assert.equal(response.total, 5);
  assert.equal(response.totalPages, 3);
  assert.equal(response.items[0]?.role, "admin");
  assert.equal(response.items[1]?.organizationId, "org_1");
});

test("getUsers scopes organization owners to their organization", async () => {
  let capturedWhere: unknown;

  const db = {
    select: () => ({
      from: () => ({
        where: async (where: unknown) => {
          capturedWhere = where;
          return [{ total: 1 }];
        },
      }),
    }),
    query: {
      users: {
        findMany: async (options?: { where?: unknown }) => {
          capturedWhere = options?.where;
          return [createUserRow({ id: "member_1", organizationId: "org_1" })];
        },
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getUsers({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "org_1",
    },
    db,
  });

  assert.ok(capturedWhere);
  assert.equal(response.items.length, 1);
  assert.equal(response.items[0]?.organizationId, "org_1");
  assert.equal(response.total, 1);
  assert.equal(response.totalPages, 1);
});

test("getUsers returns an empty page when owner has no organization", async () => {
  const db = {} as FastifyInstance["db"];

  const response = await getUsers({
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

test("getUser returns stored detail for admins", async () => {
  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
      },
    },
  } as unknown as FastifyInstance["db"];

  const response = await getUser({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    userId: "member_1",
  });

  assert.equal(response.id, "member_1");
  assert.equal(response.role, "member");
  assert.equal(response.organizationId, "org_1");
});

test("getUser rejects organization owners reading another organization", async () => {
  const db = {
    query: {
      users: {
        findFirst: async () => createUserRow({ id: "member_2", organizationId: "org_2" }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      getUser({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "org_1",
        },
        db,
        userId: "member_2",
      }),
    ForbiddenError,
  );
});

test("updateUser lets admins change role and organization", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createUserRow({
                id: "member_1",
                role: "organization_owner",
                organizationId: "org_2",
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await updateUser({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    userId: "member_1",
    changes: {
      role: "organization_owner",
      organizationId: "org_2",
    },
  });

  assert.equal(capturedUpdateValues?.role, "organization_owner");
  assert.equal(capturedUpdateValues?.organizationId, "org_2");
  assert.ok(capturedUpdateValues?.updatedAt instanceof Date);
  assert.equal(response.role, "organization_owner");
  assert.equal(response.organizationId, "org_2");
});

test("updateUser lets organization owners rename members in the same organization", async () => {
  let capturedUpdateValues: Record<string, unknown> | undefined;

  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
      },
    },
    update: () => ({
      set: (values: Record<string, unknown>) => {
        capturedUpdateValues = values;

        return {
          where: () => ({
            returning: async () => [
              createUserRow({
                id: "member_1",
                name: String(values.name),
                organizationId: "org_1",
                updatedAt: values.updatedAt as Date,
              }),
            ],
          }),
        };
      },
    }),
  } as unknown as FastifyInstance["db"];

  const response = await updateUser({
    actor: {
      id: "owner_user",
      role: "organization_owner",
      organizationId: "org_1",
    },
    db,
    userId: "member_1",
    changes: {
      name: "Updated Member",
    },
  });

  assert.equal(capturedUpdateValues?.name, "Updated Member");
  assert.equal(response.name, "Updated Member");
});

test("updateUser rejects organization owners changing privileged users", async () => {
  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "owner_1", role: "organization_owner", organizationId: "org_1" }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateUser({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "org_1",
        },
        db,
        userId: "owner_1",
        changes: {
          name: "Should Fail",
        },
      }),
    ForbiddenError,
  );
});

test("updateUser rejects inconsistent admin organization assignments", async () => {
  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      updateUser({
        actor: {
          id: "admin_user",
          role: "admin",
          organizationId: null,
        },
        db,
        userId: "member_1",
        changes: {
          role: "admin",
          organizationId: "org_1",
        },
      }),
    BadRequestError,
  );
});

test("deleteUser removes users for admins", async () => {
  let deleteWasCalled = false;

  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "member_1", role: "member", organizationId: "org_1" }),
      },
    },
    delete: () => ({
      where: () => ({
        returning: async () => {
          deleteWasCalled = true;
          return [{ id: "member_1" }];
        },
      }),
    }),
  } as unknown as FastifyInstance["db"];

  const response = await deleteUser({
    actor: {
      id: "admin_user",
      role: "admin",
      organizationId: null,
    },
    db,
    userId: "member_1",
  });

  assert.equal(deleteWasCalled, true);
  assert.deepEqual(response, { success: true });
});

test("deleteUser rejects organization owners outside their management scope", async () => {
  const db = {
    query: {
      users: {
        findFirst: async () =>
          createUserRow({ id: "admin_1", role: "admin", organizationId: null }),
      },
    },
  } as unknown as FastifyInstance["db"];

  await assert.rejects(
    () =>
      deleteUser({
        actor: {
          id: "owner_user",
          role: "organization_owner",
          organizationId: "org_1",
        },
        db,
        userId: "admin_1",
      }),
    ForbiddenError,
  );
});
