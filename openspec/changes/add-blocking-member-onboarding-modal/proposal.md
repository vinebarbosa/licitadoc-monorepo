## Why

Invited members currently can reach the authenticated app without first confirming their real name and replacing the temporary password sent by e-mail. This leaves the system with placeholder profile data and weak first-access hygiene at the exact point where invited access should become a real user account.

## What Changes

- Require provisioned `member` invitees to complete an initial profile setup on first sign-in.
- Store invited members in a pending onboarding state until they submit their name and a new password.
- Add or adapt a current-user onboarding API contract so `member` users in `pending_profile` can update their name, replace their temporary password, clear temporary-password metadata, and become `complete`.
- Show a blocking onboarding pop-up after first sign-in for invited members, with fields for name and new password.
- Prevent closing, dismissing, navigating around, or using the app behind the pop-up until the required setup is completed.
- Continue the normal app flow immediately after successful completion.

## Capabilities

### New Capabilities
- `web-member-onboarding-modal`: defines the blocking first-access pop-up experience for invited members.

### Modified Capabilities
- `user-invites`: member invite provisioning must create users in an onboarding-required state instead of treating them as complete immediately.
- `user-management`: current-user onboarding completion must support invited members and return updated session-visible user state.
- `web-authentication-flow`: sign-in and protected-route behavior must enforce the blocking member onboarding state before app usage.
- `invite-e2e-coverage`: invite E2E coverage must verify temporary-credential sign-in and required member onboarding completion.

## Impact

- API invite creation and database onboarding consistency rules for invited `member` users.
- Current-user profile/password onboarding endpoint and session-visible user fields.
- Invite e-mail flow that delivers member temporary credentials.
- Web auth session model, protected app layout, route guards, and new blocking modal UI.
- Generated API client, API unit/E2E tests, and web tests for the first-access member flow.
