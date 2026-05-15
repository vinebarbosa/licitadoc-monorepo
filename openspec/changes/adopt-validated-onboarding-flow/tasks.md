## 1. Share the validated onboarding UI

- [x] 1.1 Extract or compose the validated `onboarding-demo` profile, organization, and completion screens into reusable onboarding UI without changing the approved visual behavior.
- [x] 1.2 Update the public onboarding demo pages and exports to use the shared validated onboarding UI so demo routes remain available for visual verification.

## 2. Adopt the validated flow in real onboarding routes

- [x] 2.1 Replace the current owner profile onboarding page with the validated profile step and preserve role-aware next-step behavior.
- [x] 2.2 Replace the current owner organization onboarding page with the validated organization step and wire successful submission into the completion handoff.
- [x] 2.3 Add the real onboarding completion page and route so both roles finish on the validated success state before entering `/app`.
- [x] 2.4 Route `member` users with `pending_profile` through the validated page flow instead of the blocking app-shell modal.
- [x] 2.5 Update router entries, onboarding aliases, and route guards so `/onboarding/perfil` and `/onboarding/organizacao` behave correctly for incomplete users.

## 3. Align contracts and session handoff

- [x] 3.1 Audit the validated onboarding form needs against `POST /api/users/me/onboarding/profile` and onboarding organization creation, and adapt frontend mapping or backend schema only where the contracts do not match.
- [x] 3.2 Ensure session cache updates and invalidation correctly reflect the `member` and `organization_owner` onboarding transitions through the completion route.

## 4. Verify the onboarding journey

- [x] 4.1 Update authentication and routing tests for sign-in redirects and protected-route redirects for `pending_profile` and `pending_organization` users.
- [x] 4.2 Update onboarding tests to cover the validated owner and member page flow and remove obsolete modal-only expectations.
- [ ] 4.3 Run focused frontend and backend onboarding/auth tests and manually verify the public onboarding demo routes still render the validated UI.
