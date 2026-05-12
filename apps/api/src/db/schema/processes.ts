import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { departments } from "./departments";
import { organizations } from "./organizations";

export const processes = pgTable(
  "processes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    processNumber: text("process_number").notNull(),
    externalId: text("external_id"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    title: text("title"),
    object: text("object").notNull(),
    justification: text("justification").notNull(),
    responsibleName: text("responsible_name").notNull(),
    status: text("status").notNull().default("draft"),
    sourceKind: text("source_kind"),
    sourceReference: text("source_reference"),
    sourceMetadata: jsonb("source_metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("processes_organization_id_idx").on(table.organizationId),
    uniqueIndex("processes_organization_process_number_unique").on(
      table.organizationId,
      table.processNumber,
    ),
  ],
);

export const processDepartments = pgTable(
  "process_departments",
  {
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.processId, table.departmentId] }),
    index("process_departments_department_id_idx").on(table.departmentId),
  ],
);
