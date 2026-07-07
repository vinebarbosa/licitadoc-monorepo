CREATE TYPE "public"."user_onboarding_status" AS ENUM('pending_profile', 'pending_organization', 'complete');--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE "process_item_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quantity" numeric,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quantity" numeric,
	"unit" text NOT NULL,
	"unit_value" numeric,
	"total_value" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"message_id" uuid,
	"type" text DEFAULT 'screenshot' NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"storage_key" text,
	"mime_type" text,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_attachments_type_check" CHECK ("support_ticket_attachments"."type" IN ('screenshot', 'image'))
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"author_user_id" text,
	"role" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_messages_role_check" CHECK ("support_ticket_messages"."role" IN ('user', 'support', 'system'))
);
--> statement-breakpoint
CREATE TABLE "support_ticket_reads" (
	"ticket_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_reads_ticket_id_user_id_pk" PRIMARY KEY("ticket_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"protocol" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"requester_user_id" text,
	"requester_name" text NOT NULL,
	"requester_email" text NOT NULL,
	"requester_organization" text,
	"assignee_user_id" text,
	"context_screen" text NOT NULL,
	"context_route" text NOT NULL,
	"context_source" text NOT NULL,
	"context_entity_label" text,
	"first_response_due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_status_check" CHECK ("support_tickets"."status" IN ('open', 'waiting', 'resolved')),
	CONSTRAINT "support_tickets_priority_check" CHECK ("support_tickets"."priority" IN ('urgent', 'high', 'medium', 'low')),
	CONSTRAINT "support_tickets_context_source_check" CHECK ("support_tickets"."context_source" IN ('process', 'document', 'workspace'))
);
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "storage_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_status" "user_onboarding_status" DEFAULT 'complete' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "temporary_password_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "temporary_password_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "budget_unit_code" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "type" text DEFAULT 'attachment' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "draft_content" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "draft_content_json" jsonb;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "provisioned_user_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "crest_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "letterhead_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "letterhead_template_url" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "procurement_method" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "bidding_modality" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "process_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "issued_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "object" text NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "justification" text NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "responsible_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "responsible_user_id" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_kind" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_reference" text;--> statement-breakpoint
ALTER TABLE "processes" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "document_generation_runs" ADD CONSTRAINT "document_generation_runs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_item_components" ADD CONSTRAINT "process_item_components_item_id_process_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."process_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_items" ADD CONSTRAINT "process_items_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_message_id_support_ticket_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."support_ticket_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_reads" ADD CONSTRAINT "support_ticket_reads_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_reads" ADD CONSTRAINT "support_ticket_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_generation_runs_document_id_idx" ON "document_generation_runs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_generation_runs_status_idx" ON "document_generation_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "process_item_components_item_id_idx" ON "process_item_components" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "process_item_components_item_position_unique" ON "process_item_components" USING btree ("item_id","position");--> statement-breakpoint
CREATE INDEX "process_items_process_id_idx" ON "process_items" USING btree ("process_id");--> statement-breakpoint
CREATE UNIQUE INDEX "process_items_process_position_unique" ON "process_items" USING btree ("process_id","position");--> statement-breakpoint
CREATE INDEX "support_ticket_attachments_ticket_id_idx" ON "support_ticket_attachments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_ticket_attachments_message_id_idx" ON "support_ticket_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_organization_id_idx" ON "support_ticket_messages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_author_user_id_idx" ON "support_ticket_messages" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_created_at_idx" ON "support_ticket_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "support_ticket_reads_user_id_idx" ON "support_ticket_reads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_ticket_reads_read_at_idx" ON "support_ticket_reads" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "support_tickets_organization_id_idx" ON "support_tickets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "support_tickets_requester_user_id_idx" ON "support_tickets" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_assignee_user_id_idx" ON "support_tickets" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_protocol_unique" ON "support_tickets" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "support_tickets_context_source_idx" ON "support_tickets" USING btree ("context_source");--> statement-breakpoint
CREATE INDEX "support_tickets_updated_at_idx" ON "support_tickets" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_provisioned_user_id_users_id_fk" FOREIGN KEY ("provisioned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_onboarding_status_idx" ON "users" USING btree ("onboarding_status");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_organization_budget_unit_code_unique" ON "departments" USING btree ("organization_id","budget_unit_code");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invites_provisioned_user_id_idx" ON "invites" USING btree ("provisioned_user_id");--> statement-breakpoint
CREATE INDEX "processes_responsible_user_id_idx" ON "processes" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "processes_organization_process_number_unique" ON "processes" USING btree ("organization_id","process_number");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_onboarding_status_consistency" CHECK (("users"."onboarding_status" = 'complete' AND "users"."temporary_password_expires_at" IS NULL)
        OR ("users"."onboarding_status" = 'pending_profile'
          AND "users"."role" IN ('organization_owner', 'member')
          AND "users"."temporary_password_created_at" IS NOT NULL
          AND "users"."temporary_password_expires_at" IS NOT NULL)
        OR ("users"."onboarding_status" = 'pending_organization'
          AND "users"."role" = 'organization_owner'
          AND "users"."temporary_password_expires_at" IS NULL));