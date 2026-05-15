## Why

The current onboarding experience is split across older module-owned pages for `organization_owner` users and a blocking in-app modal for `member` users, while the product's validated onboarding UI now lives under `apps/web/src/modules/public/pages/onboarding-demo`. Bringing the real first-login flow onto that validated UI now reduces product drift, makes both roles feel like part of one deliberate journey, and gives implementation a clear contract for any frontend or API alignment still needed.

## What Changes

- Adopt the validated `onboarding-demo` UI as the visual and interaction baseline for the real onboarding flow.
- Replace the current fragmented onboarding experience with a role-aware flow for both `organization_owner` and `member` users.
- Move `member` first-login onboarding away from the blocking app-shell modal into the dedicated validated onboarding journey.
- Keep the `organization_owner` sequence as profile completion followed by organization setup, but implemented with the validated UI rather than the current legacy screens.
- Reuse the validated completion state so both roles land in a consistent success handoff before entering the app.
- Preserve public demo routes for onboarding so the validated UI remains testable in isolation after the real flow adopts it.
- Align onboarding-related API and session behavior with the validated frontend flow where the existing contract or state transitions are insufficient.
- Update route, auth, and onboarding tests to reflect the new role-aware onboarding journey.

## Capabilities

### New Capabilities
- `web-user-onboarding`: validated onboarding pages and progression for `organization_owner` and `member` first-login flows, including dedicated profile, organization, and completion states.
- `user-onboarding`: authenticated onboarding contract for first-login profile completion and role-aware progression from `pending_profile` to either `pending_organization` or `complete`.

### Modified Capabilities
- `web-authentication-flow`: sign-in redirects and protected-route gating must send pending users through the validated onboarding pages instead of the current mixed page-plus-modal behavior.

## Impact

- `apps/web/src/modules/onboarding/`, `apps/web/src/modules/public/pages/onboarding-demo/`, and `apps/web/src/modules/public/index.ts`
- `apps/web/src/app/router.tsx`, route guards, auth redirect helpers, and related frontend tests
- `apps/api/src/modules/users/complete-owner-profile-onboarding.ts`, `apps/api/src/modules/users/routes.ts`, `apps/api/src/modules/users/users.schemas.ts`, and any onboarding-related API tests
- Session/onboarding state handoff between authentication, onboarding progression, and app entry
