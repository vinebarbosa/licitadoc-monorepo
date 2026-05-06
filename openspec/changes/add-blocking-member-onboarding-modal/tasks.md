## 1. Backend State And Invite Provisioning

- [x] 1.1 Update the user onboarding consistency rule and migration so invited `member` users can be `pending_profile` with temporary-password metadata.
- [x] 1.2 Update organization-owner member invite creation to provision `member` users with `onboardingStatus = pending_profile`, temporary-password metadata, credentials, organization linkage, and invite `provisionedUserId`.
- [x] 1.3 Ensure provisioned member invite e-mails include the system sign-in link and temporary password.
- [x] 1.4 Ensure token acceptance rejects provisioned member invites and preserves legacy behavior only where still supported.

## 2. Current-User Onboarding API

- [x] 2.1 Extend or reuse the current-user profile onboarding endpoint for authenticated `member` users in `pending_profile`.
- [x] 2.2 On successful member onboarding, update name, replace password, clear temporary-password metadata, set `onboardingStatus = complete`, and return updated user/session-visible state.
- [x] 2.3 Reject onboarding completion for users who are not in an eligible `pending_profile` state without mutating profile or credential data.

## 3. Web Blocking Modal Flow

- [x] 3.1 Regenerate the API client after backend contract changes if schemas or generated types change.
- [x] 3.2 Extend auth/session helpers so `member` users in `pending_profile` are detected consistently after sign-in and session refetch.
- [x] 3.3 Add a blocking member onboarding modal in the authenticated app shell with required name and new-password fields.
- [x] 3.4 Prevent modal dismissal through close button, outside click, Escape, route navigation, or background app interaction until completion succeeds.
- [x] 3.5 On successful modal submission, update session cache, invalidate session data, close the modal, and continue the normal app route.

## 4. Tests And Verification

- [x] 4.1 Add API unit tests for member provisioning state, temporary-password metadata, conflict handling, token-acceptance rejection, and onboarding completion.
- [x] 4.2 Add API E2E coverage for invited member temporary-credential sign-in and transition from `pending_profile` to `complete`.
- [x] 4.3 Add web tests for sign-in/session handling, modal rendering, non-dismissable behavior, form submission, error handling, and completed-user pass-through.
- [x] 4.4 Run migration, API focused tests, API typecheck, API-client generation/typecheck, web typecheck, and focused web tests.
