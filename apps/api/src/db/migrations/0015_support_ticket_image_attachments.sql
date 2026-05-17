ALTER TABLE "support_ticket_attachments" ADD COLUMN "mime_type" text;
--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD COLUMN "size_bytes" integer;
--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" DROP CONSTRAINT "support_ticket_attachments_type_check";
--> statement-breakpoint
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_type_check" CHECK ("support_ticket_attachments"."type" IN ('screenshot', 'image'));
