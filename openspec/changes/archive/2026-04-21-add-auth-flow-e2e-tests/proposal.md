## Why

The API already exposes a real authentication surface through `better-auth`, but today the project only validates most behavior with module-level tests. This leaves the most failure-prone path in the system, session creation and protected access over real HTTP, without end-to-end coverage.

## What Changes

- Add end-to-end coverage for the core email-and-password authentication flow in `apps/api`.
- Introduce an E2E test harness that boots the Fastify app, talks to the real `/api/auth/*` endpoints, and preserves session cookies across requests.
- Cover the happy path for sign-up or sign-in, session retrieval, authenticated access to at least one protected route, and sign-out.
- Cover key negative cases such as unauthenticated access to protected routes and invalid credentials.
- Add test setup for isolated auth E2E execution, including database preparation and cleanup strategy suitable for repeatable local and CI runs.
- Keep browser UI automation out of scope; this change targets API-level E2E coverage of the auth flow.

## Capabilities

### New Capabilities
- `auth-e2e-coverage`: Covers repeatable end-to-end verification of the API authentication flow, session cookie lifecycle, and protected-route access.

### Modified Capabilities

## Impact

- Affected code: `apps/api` test setup, auth-related test utilities, new E2E test files, and package scripts for running auth E2E coverage.
- APIs: Exercises existing `/api/auth/*` endpoints and at least one authenticated application route without changing their functional contract.
- Data model: May require test-only seeding and cleanup for auth, session, and user tables; no product-facing schema changes are expected by default.
- Dependencies: Reuses Fastify, Better Auth, Node test tooling, and the current database stack, with a possible small addition if a dedicated E2E helper is needed.
