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
CREATE TABLE "support_ticket_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"message_id" uuid,
	"type" text DEFAULT 'screenshot' NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_attachments_type_check" CHECK ("support_ticket_attachments"."type" IN ('screenshot'))
);
--> statement-breakpoint
CREATE TABLE "support_ticket_reads" (
	"ticket_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_ticket_reads_ticket_id_user_id_pk" PRIMARY KEY("ticket_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_message_id_support_ticket_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."support_ticket_messages"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_reads" ADD CONSTRAINT "support_ticket_reads_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "support_ticket_reads" ADD CONSTRAINT "support_ticket_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "support_tickets_organization_id_idx" ON "support_tickets" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "support_tickets_requester_user_id_idx" ON "support_tickets" USING btree ("requester_user_id");
--> statement-breakpoint
CREATE INDEX "support_tickets_assignee_user_id_idx" ON "support_tickets" USING btree ("assignee_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_protocol_unique" ON "support_tickets" USING btree ("protocol");
--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets" USING btree ("priority");
--> statement-breakpoint
CREATE INDEX "support_tickets_context_source_idx" ON "support_tickets" USING btree ("context_source");
--> statement-breakpoint
CREATE INDEX "support_tickets_updated_at_idx" ON "support_tickets" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages" USING btree ("ticket_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_messages_organization_id_idx" ON "support_ticket_messages" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_messages_author_user_id_idx" ON "support_ticket_messages" USING btree ("author_user_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_messages_created_at_idx" ON "support_ticket_messages" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "support_ticket_attachments_ticket_id_idx" ON "support_ticket_attachments" USING btree ("ticket_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_attachments_message_id_idx" ON "support_ticket_attachments" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_reads_user_id_idx" ON "support_ticket_reads" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "support_ticket_reads_read_at_idx" ON "support_ticket_reads" USING btree ("read_at");
