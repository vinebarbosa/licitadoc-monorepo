ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "user_onboarding_status_consistency";

ALTER TABLE "users"
  ADD CONSTRAINT "user_onboarding_status_consistency"
  CHECK (
    ("users"."onboarding_status" = 'complete' AND "users"."temporary_password_expires_at" IS NULL)
    OR (
      "users"."onboarding_status" = 'pending_profile'
      AND "users"."role" IN ('organization_owner', 'member')
      AND "users"."temporary_password_created_at" IS NOT NULL
      AND "users"."temporary_password_expires_at" IS NOT NULL
    )
    OR (
      "users"."onboarding_status" = 'pending_organization'
      AND "users"."role" = 'organization_owner'
      AND "users"."temporary_password_expires_at" IS NULL
    )
  );
