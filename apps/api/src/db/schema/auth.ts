import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const userRoleEnum = pgEnum("user_role", ["admin", "organization_owner", "member"]);
export const userOnboardingStatusEnum = pgEnum("user_onboarding_status", [
  "pending_profile",
  "pending_organization",
  "complete",
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("member"),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    onboardingStatus: userOnboardingStatusEnum("onboarding_status").notNull().default("complete"),
    temporaryPasswordCreatedAt: timestamp("temporary_password_created_at", { withTimezone: true }),
    temporaryPasswordExpiresAt: timestamp("temporary_password_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_email_unique").on(table.email),
    index("user_organization_id_idx").on(table.organizationId),
    index("user_role_idx").on(table.role),
    index("user_onboarding_status_idx").on(table.onboardingStatus),
    check(
      "user_role_organization_consistency",
      sql`(${table.role} = 'admin' AND ${table.organizationId} IS NULL) OR (${table.role} = 'organization_owner') OR (${table.role} = 'member')`,
    ),
    check(
      "user_onboarding_status_consistency",
      sql`(${table.onboardingStatus} = 'complete' AND ${table.temporaryPasswordExpiresAt} IS NULL)
        OR (${table.onboardingStatus} = 'pending_profile'
          AND ${table.role} IN ('organization_owner', 'member')
          AND ${table.temporaryPasswordCreatedAt} IS NOT NULL
          AND ${table.temporaryPasswordExpiresAt} IS NOT NULL)
        OR (${table.onboardingStatus} = 'pending_organization'
          AND ${table.role} = 'organization_owner'
          AND ${table.temporaryPasswordExpiresAt} IS NULL)`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_id_idx").on(table.userId),
    index("session_expires_at_idx").on(table.expiresAt),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    index("verification_expires_at_idx").on(table.expiresAt),
  ],
);
