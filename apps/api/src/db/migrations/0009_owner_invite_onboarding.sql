CREATE TYPE "public"."user_onboarding_status" AS ENUM('pending_profile', 'pending_organization', 'complete');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_status" "user_onboarding_status" DEFAULT 'complete' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "temporary_password_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "temporary_password_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "provisioned_user_id" text;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_provisioned_user_id_users_id_fk" FOREIGN KEY ("provisioned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_onboarding_status_idx" ON "users" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "invites_provisioned_user_id_idx" ON "invites" USING btree ("provisioned_user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_onboarding_status_consistency" CHECK (("users"."onboarding_status" = 'complete' AND "users"."temporary_password_expires_at" IS NULL) OR ("users"."role" = 'organization_owner'));
