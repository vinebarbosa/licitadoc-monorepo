import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import type { FastifyInstance } from "fastify";
import { accounts, sessions, users, verifications } from "../../db/schema/auth";

function parseTrustedOrigins(input: string) {
  return input
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createAuth(app: FastifyInstance) {
  return betterAuth({
    secret: app.config.BETTER_AUTH_SECRET,
    baseURL: {
      allowedHosts: ["*.vercel.app"],
    },
    basePath: "/api/auth",
    trustedOrigins: parseTrustedOrigins(app.config.CORS_ORIGIN),
    database: drizzleAdapter(app.db, {
      provider: "pg",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "member",
          input: false,
        },
        organizationId: {
          type: "string",
          required: false,
          input: false,
        },
        onboardingStatus: {
          type: "string",
          required: false,
          defaultValue: "complete",
          input: false,
        },
      },
    },
    plugins: [
      openAPI({
        disableDefaultReference: true,
      }),
    ],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
