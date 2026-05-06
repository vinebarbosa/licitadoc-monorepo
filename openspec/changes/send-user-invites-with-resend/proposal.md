## Why

Invitation records are already created and redeemed, but invitees do not receive a real e-mail containing the invitation link. Sending invites through Resend completes the invitation workflow and removes the manual handoff of tokens or links.

## What Changes

- Send an invitation e-mail through Resend after a privileged actor successfully creates an invite.
- Build the invite acceptance URL from server configuration and the created invite token.
- Add a mail delivery abstraction so invite creation can be tested without contacting Resend.
- Require the Resend API key to be supplied through environment configuration; secrets are not stored in source.
- Return a clear server error if an invite cannot be delivered after persistence, without exposing provider secrets.

## Capabilities

### New Capabilities

### Modified Capabilities
- `user-invites`: Invite creation now includes delivery of an invitation e-mail containing the accept link.
- `invite-e2e-coverage`: Invite tests must verify the mail-delivery integration through a deterministic stub or mock.

## Impact

- API invite creation path under `apps/api/src/modules/invites`.
- API configuration/environment validation for Resend and public app URL settings.
- New runtime dependency on Resend's Node SDK or a small HTTP client wrapper.
- Unit/E2E tests for successful delivery and delivery failure behavior.
