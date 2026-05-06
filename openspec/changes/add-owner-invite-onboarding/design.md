## Context

The API already has invite records, Resend-backed invite e-mail delivery, Better Auth e-mail/password authentication, user roles, and an organization onboarding creation flow for `organization_owner` users without an organization. The missing piece is a coherent first-access journey for an invited organization owner: today the invite token flow expects a user to already exist or sign in independently, while the desired flow is that the admin provisions access and the owner completes their profile and prefeitura setup on first login.

## Goals / Non-Goals

**Goals:**
- Let an `admin` invite an `organization_owner` by e-mail and provision a login credential in one operation.
- Send the invitee a system link and temporary password through the configured invite mailer.
- Track owner onboarding state through user/session-facing fields.
- Require invited owners to set their real name and replace the temporary password before creating the organization.
- Complete onboarding by creating the prefeitura, linking it to the owner, and refreshing client session context.
- Keep route guards from letting incomplete invited owners into the main app.

**Non-Goals:**
- Add self-service public registration for organization owners.
- Add bulk invites, resend/rotate temporary password flows, or passwordless magic links.
- Replace member invites unless a later change explicitly does so.
- Store plaintext temporary passwords after the e-mail is sent.

## Decisions

- Model onboarding status on the user record.
  - Add an enum-like status such as `pending_profile`, `pending_organization`, and `complete`, plus temporary-password metadata needed to enforce first-login replacement. Expose this status in generated user responses and the auth session.
  - Alternative considered: add a separate status endpoint only. Rejected because every route guard and admin list already consumes user/session data, so status as a first-class user field is simpler and more ergonomic.

- Provision owner users at invite creation.
  - For admin owner invites, create a `users` row with role `organization_owner`, `organizationId = null`, onboarding status `pending_profile`, and a Better Auth e-mail/password account with a generated temporary password. Store only the hashed password and temporary-password metadata; send the raw temporary password exactly once by e-mail.
  - Alternative considered: keep token redemption and generate the password only after token preview. Rejected because the desired e-mail contains the login credential and the first real action is sign-in.

- Keep invite records as audit and lifecycle records.
  - The invite row remains the admin-visible record for who was invited, by whom, and whether the invite/onboarding has been consumed. Owner invites should reference or be derivable from the provisioned user and should transition out of `pending` when the user completes profile/password setup or when onboarding completes, depending on implementation fit.
  - Alternative considered: remove invite rows for owner invites. Rejected because the admin UI already uses invites for visibility and E2E coverage.

- Add a self-service profile completion endpoint for the current user.
  - The invited owner submits name and new password while authenticated with the temporary password. The service updates `users.name`, replaces the password hash, clears temporary-password requirements, and moves status to `pending_organization`.
  - Alternative considered: extend the generic administrative user update endpoint. Rejected because this is a self-service auth/onboarding action with different authorization and password rules.

- Reuse organization onboarding creation for the final step.
  - The current organization creation flow already creates a prefeitura and links it to an owner without organization. Extend it to require the owner to be in `pending_organization`, set onboarding status to `complete`, and return enough data for the web app to invalidate/refetch session.
  - Alternative considered: create a dedicated organization-onboarding endpoint. Rejected unless the existing route cannot express the stricter state checks cleanly.

- Web route guards are status-aware.
  - Authenticated users with incomplete owner onboarding are redirected to `/onboarding/perfil` or `/onboarding/organizacao`. Completed users enter `/app` normally.
  - Alternative considered: let app pages render empty states for missing organization. Rejected because it spreads onboarding checks across unrelated feature pages.

## Risks / Trade-offs

- Temporary password delivered by e-mail can be forwarded or exposed -> Generate high-entropy passwords, expire temporary-password use, require replacement before app access, and never log or persist plaintext.
- Existing users with the invited e-mail create ambiguous ownership -> Reject owner invites for existing users unless they are the same pending invited owner eligible for a future resend flow.
- Better Auth password hashing APIs may not be exposed directly -> Prefer Better Auth server APIs when available; otherwise isolate credential creation/replacement behind a small auth-credential service and cover it with integration tests.
- Session may not include fresh organization/status immediately after organization creation -> Invalidate/refetch `get-session` on the web after profile and organization mutations; backend responses should include the updated user context when practical.
- Existing token-acceptance tests may conflict with the new owner path -> Split coverage so owner invites use temporary credentials while member invites continue to exercise token acceptance if still supported.
