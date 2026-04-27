## Why

When a visitor is redirected from `/app` to `/entrar?redirectTo=%2Fapp`, the frontend can retain a cached anonymous `get-session` result. After a successful sign-in, navigation to `/app` can immediately hit that stale unauthenticated cache and redirect back to the same sign-in URL, making login look stuck.

## What Changes

- Reconcile frontend session query state after a successful sign-in before entering protected routes.
- Preserve the existing safe redirect handling for encoded paths such as `redirectTo=%2Fapp`.
- Ensure the protected `/app` route sees an authenticated session after login from a preserved redirect.
- Add focused tests for the stale anonymous-session cache path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-authentication-flow`: Require successful sign-in to refresh frontend session state so protected redirect targets are reachable immediately.

## Impact

- Affected package: `apps/web`
- Likely touched areas: `src/modules/auth/api/use-auth.ts`, `src/modules/auth/pages/sign-in-page.tsx`, auth/router tests, and MSW session fixtures
- No backend API contract changes are expected
