## Why

The current member invite flow assumes that the invited person already has or can independently obtain a valid login before redeeming the invite token, which does not match the onboarding experience the product now needs. Organization owners should be able to provision member access the same way admins provision organization owners: send a system link plus a temporary password, then guide the invited member through the first required setup inside the product.

## What Changes

- **BREAKING** for member invites: organization-owner invites for `member` users no longer depend on token acceptance by an already authenticated matching user; they provision a pending member account with temporary credentials.
- Send invited members an e-mail containing the system sign-in link and a temporary password when an organization owner creates the invite.
- Track invited member onboarding status so the API and web app can distinguish first access, incomplete setup, and completed access.
- Add a first-login member onboarding step where the invited member sets their real name and replaces the temporary password.
- Redirect invited members to the main app immediately after completing the first-login step, since the invite already links them to the owning organization.
- Preserve admin-created organization-owner onboarding and keep invite visibility/listing behavior aligned with the new member lifecycle.

## Capabilities

### New Capabilities
- `web-member-onboarding`: defines the first-login web experience for invited members, including profile/password completion and app entry after setup.

### Modified Capabilities
- `user-invites`: organization-owner member invites now provision temporary credentials and onboarding state instead of relying on authenticated token acceptance.
- `user-management`: user/session-facing data exposes the onboarding state needed to route invited members through first access safely.
- `web-authentication-flow`: sign-in and protected-route handling redirect invited members through the required first-login setup before entering the app.
- `invite-e2e-coverage`: invite E2E coverage verifies member temporary-credential provisioning, first sign-in, and onboarding completion.

## Impact

- API invite creation, invite lifecycle serialization, and any self-service onboarding endpoints under `apps/api/src/modules/invites`, `apps/api/src/modules/users`, and auth integration surfaces.
- Auth/user storage for temporary-password handling, onboarding status, and session-visible member context.
- Invite e-mail content and delivery paths that currently send the system link.
- Web auth/session guards, sign-in success handling, and new invited-member onboarding UI in `apps/web`.
- Generated OpenAPI/API client contracts plus API/web/E2E coverage for the revised member first-access flow.