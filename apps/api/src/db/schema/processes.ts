import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
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
    procurementMethod: text("procurement_method"),
    biddingModality: text("bidding_modality"),
    processNumber: text("process_number").notNull(),
    externalId: text("external_id"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    title: text("title"),
    object: text("object").notNull(),
    justification: text("justification").notNull(),
    responsibleName: text("responsible_name").notNull(),
    responsibleUserId: text("responsible_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("draft"),
    sourceKind: text("source_kind"),
    sourceReference: text("source_reference"),
    sourceMetadata: jsonb("source_metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("processes_organization_id_idx").on(table.organizationId),
    index("processes_responsible_user_id_idx").on(table.responsibleUserId),
    uniqueIndex("processes_organization_process_number_unique").on(
      table.organizationId,
      table.processNumber,
    ),
  ],
);

export const processItems = pgTable(
  "process_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    kind: text("kind").notNull(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    quantity: numeric("quantity"),
    unit: text("unit").notNull(),
    unitValue: numeric("unit_value"),
    totalValue: numeric("total_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("process_items_process_id_idx").on(table.processId),
    uniqueIndex("process_items_process_position_unique").on(table.processId, table.position),
  ],
);

export const processItemComponents = pgTable(
  "process_item_components",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => processItems.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    quantity: numeric("quantity"),
    unit: text("unit").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("process_item_components_item_id_idx").on(table.itemId),
    uniqueIndex("process_item_components_item_position_unique").on(table.itemId, table.position),
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
