## Context

The web app now separates the public landing page at `/` from the authenticated app shell at `/app`. The sign-in page currently derives its post-login destination from the `redirectTo` query parameter, but when that parameter is absent the helper falls back to `/`, sending successful logins back to the landing page. The protected-route guard also redirects unauthenticated visitors to `/entrar` without carrying the route they originally attempted.

## Goals / Non-Goals

**Goals:**
- Make direct successful sign-in enter the internal app shell at `/app`.
- Preserve safe internal redirect targets when a visitor is sent to sign in from a protected route.
- Keep existing validation that rejects unsafe redirect targets such as external URLs or protocol-relative paths.
- Cover the behavior with focused frontend tests.

**Non-Goals:**
- Change the backend authentication contract.
- Change session storage or cookie behavior.
- Add role-specific post-login destinations.
- Redesign the sign-in page or public landing page.

## Decisions

### Decision: Use `/app` as the default authenticated destination
The auth redirect helper should return `/app` when the sign-in route has no valid `redirectTo` parameter. This aligns the default login outcome with the newly introduced authenticated app shell.

Alternatives considered:
- Keep `/` as the fallback and change only the landing page link to include `?redirectTo=/app`.
  Rejected because users can reach `/entrar` directly, and direct sign-in should still enter the product.
- Hard-code navigation in the sign-in page after mutation.
  Rejected because the redirect helper already centralizes redirect target validation.

### Decision: Preserve protected-route destinations in the guard
When an unauthenticated visitor opens a protected route, the route guard should redirect to `/entrar?redirectTo=<current location>`. This keeps the sign-in page responsible for validating and consuming the destination while the guard only records the attempted internal path.

Alternatives considered:
- Store the attempted route in global state.
  Rejected because the destination can be expressed safely in the URL and survives page refreshes.
- Preserve only `/app` for all protected redirects.
  Rejected because future protected nested routes should return users to their intended destination.

### Decision: Continue rejecting unsafe redirect targets
The helper should continue to accept only same-origin absolute app paths and reject external or protocol-relative values. This keeps the redirect behavior predictable and avoids turning sign-in into an open redirect.

## Risks / Trade-offs

- [Risk] Query strings on protected routes could be dropped if only `pathname` is preserved. -> Mitigation: build the redirect target from pathname plus search when available.
- [Risk] The app may briefly render loading fallback while session state resolves. -> Mitigation: keep the existing loading behavior and focus this change only on destination selection.
- [Risk] Future role-specific landing destinations may need different defaults. -> Mitigation: centralizing the default in the auth helper keeps that future change small.

## Migration Plan

Update the frontend auth redirect helper, route guard behavior, and focused tests. Rollback is straightforward by restoring the previous default redirect target and guard destination behavior.

## Open Questions

None.
