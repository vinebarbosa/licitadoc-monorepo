import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { TiptapDocumentJson } from "../../shared/tiptap-json";
import { organizations } from "./organizations";
import { processes } from "./processes";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("attachment"),
    status: text("status").notNull().default("completed"),
    draftContent: text("draft_content"),
    draftContentJson: jsonb("draft_content_json").$type<TiptapDocumentJson | null>(),
    storageKey: text("storage_key"),
    responsibles: text("responsibles").array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("documents_organization_id_idx").on(table.organizationId),
    index("documents_process_id_idx").on(table.processId),
    index("documents_type_idx").on(table.type),
    index("documents_status_idx").on(table.status),
    check(
      "documents_responsibles_not_empty",
      sql`coalesce(array_length(${table.responsibles}, 1), 0) > 0`,
    ),
  ],
);

export const documentGenerationRuns = pgTable(
  "document_generation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    providerKey: text("provider_key").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull(),
    requestMetadata: jsonb("request_metadata").$type<Record<string, unknown>>().notNull(),
    responseMetadata: jsonb("response_metadata").$type<Record<string, unknown> | null>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details").$type<Record<string, unknown> | null>(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("document_generation_runs_document_id_idx").on(table.documentId),
    index("document_generation_runs_status_idx").on(table.status),
  ],
);
