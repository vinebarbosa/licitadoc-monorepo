## Context

Member invites are now provisioned as real user accounts with temporary credentials, but the product requires one more guardrail: invited members must not use the app until they replace the temporary password and provide their real name. The existing owner onboarding flow already has the backend primitives for `pending_profile`, password replacement, and session-visible onboarding status; this change applies that first-access requirement to invited members and presents it as a blocking in-app modal rather than a separate full page.

The current database consistency rule must also align with the intended lifecycle. An invited member needs to be allowed to exist as `member` + `pending_profile` while the temporary password is still valid, then transition to `complete` with temporary-password metadata cleared.

## Goals / Non-Goals

**Goals:**
- Provision invited members with `onboardingStatus = pending_profile` and temporary-password metadata.
- Require member invitees to submit name and new password before app usage.
- Reuse the authenticated current-user onboarding mutation for profile/password completion where possible.
- Present the required first-access form as a blocking modal over authenticated app routes.
- Refresh session/cache state after completion and continue the normal `/app` flow.
- Cover backend state transitions and web blocking behavior with focused tests.

**Non-Goals:**
- Adding organization setup for members.
- Adding optional profile editing for already-complete members.
- Adding temporary-password resend or rotation.
- Replacing the organization-owner onboarding flow.
- Allowing invited members to bypass onboarding through route changes or modal dismissal.

## Decisions

### Store invited members as pending until profile completion
Organization-owner member invite creation will create a `member` user linked to the inviter's organization with `onboardingStatus = pending_profile`, temporary-password timestamps, and a credential account.

Rationale:
- The modal decision must be enforceable from session state immediately after sign-in.
- Placeholder e-mail-as-name data should not be considered a completed account.
- Keeping the state on the user record lets API and web guards share one source of truth.

Alternative considered:
- Keep members as `complete` and infer first access from temporary-password metadata. Rejected because `complete` users are allowed through normal app routes and the database constraint already treats temporary-password metadata as incomplete state.

### Generalize profile onboarding completion for invited users
The current-user onboarding completion endpoint should accept authenticated users in `pending_profile` when they are either invited owners or invited members. For members, success updates the name, replaces the credential password, clears temporary-password metadata, marks `onboardingStatus = complete`, and returns the updated user.

Rationale:
- Owners and members share the first-access profile/password concern.
- A self-service endpoint avoids exposing this flow through admin user update APIs.
- Returning the updated user lets the frontend immediately update React Query session cache.

Alternative considered:
- Create a member-only endpoint. Rejected because it would duplicate validation and password replacement behavior.

### Use a blocking modal in the authenticated shell
The web app will render a modal when the authenticated session user is a `member` with `onboardingStatus = pending_profile`. The modal should use dialog semantics but remove all escape hatches: no close button, no outside-click dismissal, no Escape dismissal, and no app interaction behind it.

Rationale:
- The user asked specifically for a pop-up, and a shell-level modal lets the member remain on the intended destination while completing setup.
- The shell already owns authenticated app layout and can enforce the block consistently across `/app` child routes.

Alternative considered:
- Redirect members to a dedicated onboarding route. Rejected for this change because the requested UX is a blocking pop-up, not a separate page.

### Preserve backend enforcement even with frontend modal
Protected-route modal enforcement is UX, not the security boundary. The backend state transition still requires `pending_profile` and authenticated current user. Future write endpoints can also decide to block incomplete users if product policy needs stricter server-side authorization.

Rationale:
- A user can bypass frontend JavaScript, so the onboarding mutation must remain scoped and stateful.
- The immediate requirement is to block normal frontend usage; broader API-level blocking can be added separately if needed.

Alternative considered:
- Add global API middleware to reject all incomplete members except onboarding/session routes. Deferred because it could affect background session fetching and existing routes more broadly than this feature requires.

## Risks / Trade-offs

- [Database constraint rejects pending members] -> Update the user onboarding consistency rule and migration so `member` users may be `pending_profile` only while temporary-password metadata exists.
- [Modal can trap users after expired temporary password] -> Show the API error clearly and keep the user blocked until an admin/owner resolves the invite; temporary-password resend remains out of scope.
- [Session cache remains stale after completion] -> Update local query cache with the returned user and invalidate the session query after mutation success.
- [Keyboard or screen-reader users cannot complete setup comfortably] -> Use accessible dialog primitives, clear labels, focus management, validation messages, and a submit button that exposes pending/error states.

## Migration Plan

1. Add a migration or adjust the pending migration to permit invited `member` users in `pending_profile` with temporary-password metadata.
2. Update member invite creation to persist `pending_profile` and temporary-password metadata for provisioned members.
3. Reuse or extend the onboarding completion endpoint for members and ensure it clears temporary-password metadata on success.
4. Add the blocking web modal and session-cache refresh.
5. Regenerate API client contracts and run focused API/web/E2E tests.

Rollback: stop rendering the modal, return member invite provisioning to `complete` with cleared temporary-password metadata, and retain the endpoint as unused compatibility until it can be removed safely.

## Open Questions

- Should incomplete invited members be blocked server-side from all non-onboarding API routes in this same change, or should the first iteration keep enforcement in the web shell plus onboarding endpoint state validation?
