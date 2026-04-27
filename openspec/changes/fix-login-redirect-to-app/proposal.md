## Why

After the internal `/app` shell was introduced, the sign-in flow still defaults successful logins back to `/`, which is the public landing page. This makes a normal login feel like it failed to enter the product, and it also loses the original protected route when a visitor is redirected to sign in.

## What Changes

- Change the default post-authenticated destination for direct sign-ins from `/` to `/app`.
- Preserve the originally requested protected route when an unauthenticated visitor is redirected to `/entrar`.
- Keep redirect target validation so sign-in cannot navigate to unsafe external or protocol-relative URLs.
- Add focused frontend tests covering direct sign-in and protected-route sign-in redirection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-authentication-flow`: Define that successful sign-in enters `/app` by default and that protected-route redirects preserve the attempted internal destination.

## Impact

- Affected package: `apps/web`
- Likely touched areas: `src/modules/auth/api/use-auth.ts`, `src/modules/auth/pages/sign-in-page.tsx`, `src/app/route-guards.tsx`, `src/app/router.tsx`, and focused auth/router tests
- No backend API contract changes are expected
