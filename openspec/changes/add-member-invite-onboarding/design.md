## Context

The platform already has role-scoped invites, invite e-mail delivery, Better Auth e-mail/password sign-in, and organization-scoped member management. What it does not yet have is a first-access journey for invited members that starts from a provisioned account instead of from token redemption by an already authenticated user. The product now wants organization-owner member invites to behave like provisioned owner invites: the inviter creates access, the invitee receives a temporary password by e-mail, and the invitee finishes the required setup inside the system on first login.

This change touches multiple surfaces at once: invite provisioning, auth/session-visible onboarding state, self-service onboarding APIs, invite lifecycle semantics, sign-in redirects, and a new member-facing onboarding page. The design should stay aligned with the owner onboarding pattern so the product does not end up with two unrelated invite journeys.

## Goals / Non-Goals

**Goals:**
- Let an `organization_owner` invite a `member` by e-mail and provision a login credential in one operation.
- Send the invited member a system sign-in link and temporary password by e-mail.
- Track invited member onboarding state through user/session-facing data and invite-visible lifecycle context.
- Require invited members to set their real name and replace the temporary password before entering the app.
- Route invited members directly into `/app` after the first-login setup succeeds because the invite already links the member to an organization.
- Preserve existing invite visibility, owner scope rules, and owner/admin provisioning patterns where they still apply.

**Non-Goals:**
- Replacing admin-created organization-owner onboarding.
- Keeping token acceptance as the primary path for newly invited members.
- Adding resend/rotate temporary password flows, bulk invites, or public self-registration.
- Adding a separate organization-setup step for members.

## Decisions

### Reuse onboarding status as the source of truth for invited members
The system will expose invited member onboarding state through the stored user record and authenticated session, using the same first-class status model already needed for invite-based onboarding flows.

Rationale:
- Sign-in redirects and protected-route guards need status immediately after authentication.
- A first-class status field avoids adding a separate polling endpoint just to determine whether the invited member has finished setup.

Alternatives considered:
- Add a standalone member-onboarding-status endpoint only. Rejected because route guards and session-aware web flows would still need a user/session-visible state.

### Provision member users during invite creation
When an `organization_owner` creates a member invite, the system will provision a `member` user linked to the inviter's organization, assign temporary credentials, and mark the invited member as `pending_profile`.

Rationale:
- The desired e-mail already contains the login credential, so the account must exist before the invited member signs in.
- This mirrors the owner provisioning model instead of maintaining a special-case invite path for members.

Alternatives considered:
- Keep creating only an invite token and provision the user after token redemption. Rejected because that preserves the same dependency on an already-authenticated or separately-created account.

### Keep invite rows as audit records and mark them consumed through onboarding completion
Invite rows remain the inviter-visible source of truth for who was invited, by whom, and whether the invite has been completed. Provisioned member invites should reference the created user and transition out of `pending` when the invited member successfully completes the profile/password onboarding step.

Rationale:
- The owner/admin management surfaces already rely on invite rows for visibility.
- Completing the profile/password step is the real point at which the member has consumed the invite and activated access.

Alternatives considered:
- Mark the invite accepted on first successful sign-in. Rejected because sign-in alone does not prove that the temporary password has been replaced or the required profile fields are complete.

### Reuse a self-service profile/password onboarding contract for invited users
The API will expose a self-service authenticated mutation for users in `pending_profile` that updates the user's name, replaces the temporary password, clears temporary-password requirements, advances onboarding to `complete` for members, and returns refreshed user/session context.

Rationale:
- Members and owners share the same first-login concern: replace the temporary password and complete identity fields.
- A current-user onboarding contract is safer and clearer than forcing this flow through administrative user update endpoints.

Alternatives considered:
- Build a member-only onboarding endpoint separate from owner profile setup. Rejected because the validation and authorization shape is the same and should stay reusable.

### Add a dedicated web member-onboarding route that reuses profile-setup primitives
The web app will add a member-facing onboarding route for authenticated `member` users in `pending_profile`. It may reuse the same form primitives as owner profile onboarding, but it should have member-specific copy and should navigate directly to `/app` after completion.

Rationale:
- Members do not have an organization-creation step, so the route and success path should be simpler than owner onboarding.
- A dedicated route keeps the UX explicit while still allowing shared form logic behind the scenes.

Alternatives considered:
- Reuse the exact owner onboarding route and copy. Rejected because the post-submit path and explanatory content are different enough to deserve a distinct member-facing step.

## Risks / Trade-offs

- [Temporary passwords sent by e-mail can be forwarded or exposed] -> Generate high-entropy passwords, require replacement before app access, and never persist or log plaintext credentials.
- [Existing users with the invited e-mail create ownership conflicts] -> Reject member invites for e-mails already bound to unrelated active users and keep conflict behavior explicit.
- [Invite lifecycle semantics become less obvious when token acceptance is no longer used for members] -> Expose provisioned-user and onboarding context in invite-visible responses so inviter-facing UIs can show progress clearly.
- [Member and owner onboarding could drift into parallel implementations] -> Reuse the same current-user profile/password completion contract and shared frontend form pieces where the behavior is identical.

## Migration Plan

No data migration is required beyond any schema additions needed for onboarding state or temporary-password metadata if they are not already present. Existing pending member invites created under the old token-acceptance model should either continue to honor the legacy path until consumed or be explicitly migrated behind a controlled rollout if the team chooses to normalize them.

Rollback is straightforward: stop provisioning member users at invite creation, remove the member first-login route, and restore token-based member acceptance as the primary invite-consumption path.

## Open Questions

- Should legacy pending member invites created before this change remain redeemable through token acceptance, or should the system provide a migration path that converts them into provisioned member accounts?
- Should inviter-facing invite listings expose onboarding progress directly on the invite row, or is a provisioned-user reference plus session/user status sufficient for the first version?