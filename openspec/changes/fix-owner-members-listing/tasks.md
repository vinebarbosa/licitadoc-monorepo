## 1. Backend Listing Behavior

- [x] 1.1 Verify organization-owner `/api/users` listing includes same-organization `member` users with `onboardingStatus = pending_profile`.
- [x] 1.2 Add or adjust API unit tests for owner member listing across `pending_profile` and `complete` members.
- [x] 1.3 Add or adjust API E2E coverage that creates a member invite and verifies the provisioned member is visible through the owner-scoped users list.

## 2. Web Members Page Data Flow

- [x] 2.1 Ensure the owner members page uses the same organization-scoped member list query as the backend contract.
- [x] 2.2 Ensure member invite creation invalidates/refetches both the users list query and the invites list query.
- [x] 2.3 Ensure invite mutation success UI only runs for successful invite-shaped responses and shows error feedback for error-shaped responses.

## 3. Web Rendering And Tests

- [x] 3.1 Render pending onboarding members in the members table instead of the empty state.
- [x] 3.2 Add web tests for existing complete members, pending invited members, empty state, post-invite refresh, and invite error feedback.
- [x] 3.3 Run focused API tests, focused web tests, and web/API typechecks.
