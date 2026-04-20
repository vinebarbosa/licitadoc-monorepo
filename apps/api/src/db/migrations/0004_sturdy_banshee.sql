ALTER TABLE "organizations" ADD COLUMN "official_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "cnpj" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "zip_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "institutional_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "authority_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "authority_role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "created_by_user_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_cnpj_unique" ON "organizations" USING btree ("cnpj");