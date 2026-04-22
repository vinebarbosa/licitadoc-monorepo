ALTER TABLE "documents" ADD COLUMN "type" text DEFAULT 'attachment' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "draft_content" text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_key" DROP NOT NULL;--> statement-breakpoint
CREATE TABLE "document_generation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"provider_key" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"request_metadata" jsonb NOT NULL,
	"response_metadata" jsonb,
	"error_code" text,
	"error_message" text,
	"error_details" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "document_generation_runs" ADD CONSTRAINT "document_generation_runs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_generation_runs_document_id_idx" ON "document_generation_runs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_generation_runs_status_idx" ON "document_generation_runs" USING btree ("status");
