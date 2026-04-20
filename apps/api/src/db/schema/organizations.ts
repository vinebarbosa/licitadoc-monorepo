import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    officialName: text("official_name").notNull(),
    cnpj: text("cnpj").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    address: text("address").notNull(),
    zipCode: text("zip_code").notNull(),
    phone: text("phone").notNull(),
    institutionalEmail: text("institutional_email").notNull(),
    website: text("website"),
    logoUrl: text("logo_url"),
    authorityName: text("authority_name").notNull(),
    authorityRole: text("authority_role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    uniqueIndex("organizations_cnpj_unique").on(table.cnpj),
    index("organizations_name_idx").on(table.name),
  ],
);
