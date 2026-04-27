## Context

The protected `/app` route uses the session-aware guard backed by the generated `get-session` React Query hook. When an unauthenticated visitor opens `/app`, that query can cache `null` before the guard redirects to `/entrar?redirectTo=%2Fapp`. The sign-in page then authenticates and navigates to `/app`, but it currently does not reconcile the cached session query. The protected route can therefore immediately read stale anonymous state and redirect back to sign-in.

## Goals / Non-Goals

**Goals:**
- After successful sign-in, make the frontend session query reflect the authenticated state before protected route guards rely on it.
- Keep encoded redirect targets such as `%2Fapp` valid and safe.
- Prevent the visible loop where `/entrar?redirectTo=%2Fapp` stays on the sign-in page after valid credentials.
- Add focused tests that reproduce the stale anonymous session cache path.

**Non-Goals:**
- Change backend sign-in or session contracts.
- Change the `/app` route guard access rules.
- Add role-specific post-login destinations.
- Redesign the sign-in page.

## Decisions

### Decision: Reconcile session cache in the auth module after sign-in
The frontend auth module should provide a sign-in path that invalidates or refetches the generated `get-session` query after successful authentication. This keeps the session query and sign-in mutation coordinated at the same module boundary already used for sign-out cache cleanup.

Alternatives considered:
- Navigate to `/app` and let the protected route refetch later.
  Rejected because the route can synchronously consume cached `null` and redirect back before a fresh session is observed.
- Bypass the guard immediately after sign-in.
  Rejected because the guard should remain the single access decision for protected routes.

### Decision: Keep redirect validation separate from session reconciliation
The `redirectTo` helper should continue to accept safe decoded app paths and reject unsafe values. The bug is not the encoded `%2Fapp` value itself; `URLSearchParams` decodes it to `/app`. The missing piece is stale session state after successful sign-in.

Alternatives considered:
- Special-case `%2Fapp` before reading query params.
  Rejected because the browser already decodes the value correctly and special-casing would miss other preserved routes.

### Decision: Cover the full router path, not only helper functions
Tests should include a route-level scenario where `/app` first returns an anonymous session, redirects to `/entrar?redirectTo=%2Fapp`, sign-in succeeds, and the app can render `/app`. This catches the regression that unit-level redirect tests missed.

## Risks / Trade-offs

- [Risk] Waiting for session refetch could add a small delay after sign-in. -> Mitigation: only do this after successful sign-in and keep the submit button pending during the transition.
- [Risk] Query key mismatch could leave stale session data. -> Mitigation: use the generated `getSessionQueryKey` used by `useAuthSession`.
- [Risk] Refetch failure after successful sign-in could block navigation. -> Mitigation: prefer a cache update from the sign-in response when possible, with invalidation/refetch as follow-up verification.

## Migration Plan

Update the frontend auth module/sign-in page to reconcile session cache after successful sign-in, add focused tests, and validate with typecheck, focused lint, and relevant Vitest coverage. Rollback is limited to reverting the sign-in cache reconciliation and tests.

## Open Questions

None.
