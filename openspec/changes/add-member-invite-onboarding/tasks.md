## 1. Auth context and onboarding state

- [x] 1.1 Extend the user/auth data model as needed to represent invited member onboarding state and temporary-password requirements in persisted user and session-visible data.
- [x] 1.2 Add or adapt a self-service authenticated onboarding contract for users in `pending_profile` that updates name, replaces the temporary password, and returns refreshed user/session context.

## 2. Member invite provisioning

- [x] 2.1 Update organization-owner member invite creation to provision a pending `member` user linked to the inviter's organization with temporary credentials.
- [x] 2.2 Update invite serializers, invite listings, and invite e-mail content so inviter-facing flows can see provisioned-user/onboarding context and the invitee receives the system link plus temporary password.
- [x] 2.3 Preserve explicit conflict handling for existing users and reject token acceptance for provisioned member invites.

## 3. Web member first-login flow

- [x] 3.1 Regenerate the API client after backend contract changes and extend the web auth session model with member onboarding status handling.
- [x] 3.2 Add member-aware sign-in success handling and protected-route redirects for authenticated `member` users in `pending_profile`.
- [x] 3.3 Build the invited-member onboarding page for name and new password completion and navigate the user to `/app` after success.

## 4. Tests and verification

- [x] 4.1 Add API unit and end-to-end coverage for member invite provisioning, temporary-password delivery, onboarding completion, and token-acceptance rejection.
- [x] 4.2 Add web tests for member onboarding routes, sign-in redirects, validation states, and completed-user redirects.
- [x] 4.3 Run focused API/web validation, affected OpenAPI or client generation checks, and any required migration verification.