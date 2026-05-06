import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { accounts } from "../../db";

type Db = Pick<FastifyInstance["db"], "insert" | "update">;

export function generateTemporaryPassword() {
  return `${randomBytes(9).toString("base64url")}A1!`;
}

export async function createCredentialAccount({
  db,
  password,
  userId,
}: {
  db: Db;
  password: string;
  userId: string;
}) {
  const passwordHash = await hashPassword(password);

  await db.insert(accounts).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });
}

export async function replaceCredentialPassword({
  db,
  password,
  userId,
}: {
  db: Db;
  password: string;
  userId: string;
}) {
  const passwordHash = await hashPassword(password);

  const [account] = await db
    .update(accounts)
    .set({
      password: passwordHash,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .returning({
      id: accounts.id,
    });

  if (account) {
    return;
  }

  await createCredentialAccount({
    db,
    password,
    userId,
  });
}
