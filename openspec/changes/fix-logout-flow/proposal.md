## Why

The internal app shell exposes a visible `Sair` action, but it currently does not reliably terminate the authenticated session. Users can appear to log out while the session remains active, which is confusing and weakens the expected access boundary around `/app`.

## What Changes

- Wire the app shell logout action to the existing backend auth sign-out contract.
- Clear or invalidate frontend session state after sign-out so protected routes observe the unauthenticated state.
- Navigate the user to the public sign-in route after logout completes.
- Add focused frontend coverage proving that logout calls the auth contract, leaves the app shell, and protected routes no longer render as authenticated.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-authentication-flow`: Add explicit logout behavior for authenticated app users.

## Impact

- Affected package: `apps/web`
- Likely touched areas: app shell sidebar/logout UI, auth API hook module, query/session cache handling, router/auth tests, and MSW auth fixtures/handlers
- Expected backend contract: existing `/api/auth/sign-out`; no backend route change is expected
