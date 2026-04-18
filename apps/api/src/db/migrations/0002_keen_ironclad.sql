ALTER TABLE "users" DROP CONSTRAINT "user_role_organization_consistency";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_role_organization_consistency" CHECK (("users"."role" = 'admin' AND "users"."organization_id" IS NULL) OR ("users"."role" = 'organization_owner') OR ("users"."role" = 'member'));
