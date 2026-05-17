import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { organizations } from "./organizations";

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    protocol: text("protocol").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("open"),
    priority: text("priority").notNull().default("medium"),
    requesterUserId: text("requester_user_id").references(() => users.id, { onDelete: "set null" }),
    requesterName: text("requester_name").notNull(),
    requesterEmail: text("requester_email").notNull(),
    requesterOrganization: text("requester_organization"),
    assigneeUserId: text("assignee_user_id").references(() => users.id, { onDelete: "set null" }),
    contextScreen: text("context_screen").notNull(),
    contextRoute: text("context_route").notNull(),
    contextSource: text("context_source").notNull(),
    contextEntityLabel: text("context_entity_label"),
    firstResponseDueAt: timestamp("first_response_due_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("support_tickets_organization_id_idx").on(table.organizationId),
    index("support_tickets_requester_user_id_idx").on(table.requesterUserId),
    index("support_tickets_assignee_user_id_idx").on(table.assigneeUserId),
    uniqueIndex("support_tickets_protocol_unique").on(table.protocol),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_priority_idx").on(table.priority),
    index("support_tickets_context_source_idx").on(table.contextSource),
    index("support_tickets_updated_at_idx").on(table.updatedAt),
    check("support_tickets_status_check", sql`${table.status} IN ('open', 'waiting', 'resolved')`),
    check(
      "support_tickets_priority_check",
      sql`${table.priority} IN ('urgent', 'high', 'medium', 'low')`,
    ),
    check(
      "support_tickets_context_source_check",
      sql`${table.contextSource} IN ('process', 'document', 'workspace')`,
    ),
  ],
);

export const supportTicketMessages = pgTable(
  "support_ticket_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id").references(() => users.id, { onDelete: "set null" }),
    role: text("role").notNull(),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("support_ticket_messages_ticket_id_idx").on(table.ticketId),
    index("support_ticket_messages_organization_id_idx").on(table.organizationId),
    index("support_ticket_messages_author_user_id_idx").on(table.authorUserId),
    index("support_ticket_messages_created_at_idx").on(table.createdAt),
    check(
      "support_ticket_messages_role_check",
      sql`${table.role} IN ('user', 'support', 'system')`,
    ),
  ],
);

export const supportTicketAttachments = pgTable(
  "support_ticket_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => supportTicketMessages.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().default("screenshot"),
    name: text("name").notNull(),
    description: text("description").notNull(),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("support_ticket_attachments_ticket_id_idx").on(table.ticketId),
    index("support_ticket_attachments_message_id_idx").on(table.messageId),
    check("support_ticket_attachments_type_check", sql`${table.type} IN ('screenshot', 'image')`),
  ],
);

export const supportTicketReads = pgTable(
  "support_ticket_reads",
  {
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ticketId, table.userId] }),
    index("support_ticket_reads_user_id_idx").on(table.userId),
    index("support_ticket_reads_read_at_idx").on(table.readAt),
  ],
);
