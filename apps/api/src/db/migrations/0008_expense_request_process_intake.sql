ALTER TABLE "departments" ADD COLUMN "budget_unit_code" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_kind" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_reference" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_organization_budget_unit_code_unique" ON "departments" USING btree ("organization_id","budget_unit_code");
