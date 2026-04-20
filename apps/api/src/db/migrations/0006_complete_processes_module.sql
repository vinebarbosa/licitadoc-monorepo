ALTER TABLE "processes" RENAME COLUMN "title" TO "object";--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "process_number" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "justification" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "responsible_name" text;--> statement-breakpoint
UPDATE "processes"
SET
  "type" = coalesce("type", 'general'),
  "process_number" = coalesce("process_number", concat('legacy-', "id"::text)),
  "issued_at" = coalesce("issued_at", "created_at"),
  "justification" = coalesce("justification", "object"),
  "responsible_name" = coalesce("responsible_name", 'Not informed');--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "process_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "issued_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "justification" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "responsible_name" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "processes_organization_process_number_unique" ON "processes" USING btree ("organization_id","process_number");
