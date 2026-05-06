## Why

The current invite flow assumes that an invited user can redeem a token and immediately receive role/organization context, but that leaves too much work outside the system and does not fit the desired first-access journey. Admin-created organization-owner invites should provision a login path, guide the owner through profile and organization setup, and only then release the user into the application.

## What Changes

- **BREAKING** for organization-owner invites: admin-created owner invites no longer rely on token acceptance by an already authenticated matching user; they provision a pending `organization_owner` user with a temporary password.
- Send the invited owner an e-mail containing the system link and temporary password.
- Track invited owner onboarding status so the API and web app can tell whether the user still needs to complete profile/password setup, organization setup, or is ready for the app.
- Add first-login profile completion where the invited owner provides their name and replaces the temporary password.
- Keep organization onboarding as the step that creates the prefeitura and automatically links it to the owner, then refreshes the session context.
- Route incomplete invited owners to the required onboarding step before they can access the main app.
- Preserve existing scoped invite/list behavior where it still applies, including member invites unless replaced by a later change.

## Capabilities

### New Capabilities
- `web-owner-onboarding`: Defines the web onboarding experience for invited organization owners, including first-login profile/password setup, organization setup, and app entry after completion.

### Modified Capabilities
- `user-invites`: Admin organization-owner invites provision a pending user with temporary credentials and e-mail delivery instead of relying on authenticated token acceptance.
- `user-management`: User records expose and enforce onboarding status for invited owners.
- `organization-management`: Organization onboarding completes the invited owner setup and refreshes the linked user/session context.
- `web-authentication-flow`: Sign-in and route protection redirect incomplete invited owners into the onboarding flow.
- `invite-e2e-coverage`: Invite E2E coverage verifies temporary credential provisioning and onboarding-state transitions.

## Impact

- API invite creation and e-mail delivery under `apps/api/src/modules/invites`.
- Auth/user storage for temporary-password state, name completion, password replacement, and onboarding status.
- Organization onboarding route/service and session refresh behavior after organization creation.
- Web auth/session guards and new owner onboarding screens in `apps/web`.
- Generated OpenAPI/API client contracts and API/web/E2E coverage.
