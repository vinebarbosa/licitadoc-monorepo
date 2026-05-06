import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum, users } from "./auth";
import { organizations } from "./organizations";

export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "revoked"]);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    invitedByUserId: text("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    provisionedUserId: text("provisioned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedByUserId: text("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    tokenHash: text("token_hash").notNull(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("invites_token_hash_unique").on(table.tokenHash),
    index("invites_email_idx").on(table.email),
    index("invites_status_idx").on(table.status),
    index("invites_organization_id_idx").on(table.organizationId),
    index("invites_invited_by_user_id_idx").on(table.invitedByUserId),
    index("invites_provisioned_user_id_idx").on(table.provisionedUserId),
  ],
);
