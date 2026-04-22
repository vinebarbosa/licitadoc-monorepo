## Why

The `users` module already has service-level coverage and approved behavioral requirements, but it still lacks API end-to-end tests for the real administrative flows. That leaves listing, detail access, updates, and deletion exposed to regressions in session auth, route wiring, visibility scope, and persisted side effects that unit tests would not catch.

## What Changes

- Add API E2E tests for listing and reading users through real authenticated sessions.
- Add API E2E tests for administrative user updates and deletion, including the persisted role and organization effects after a successful change.
- Add the fixture setup and cleanup needed to create admin, organization owner, and managed users inside the isolated E2E database.
- Extend the API E2E runbook as needed so user-management coverage runs alongside the existing auth and invite suites.

## Capabilities

### New Capabilities
- `user-e2e-coverage`: Covers API-level end-to-end verification of user listing, detail reads, updates, and deletion flows in `apps/api`.

### Modified Capabilities

## Impact

- Affected code: `apps/api/test/**` E2E suites and helpers, user-related fixture setup, and repository documentation for API E2E execution.
- Systems: Dedicated E2E database state will include user and organization fixtures needed to exercise admin and organization-owner management flows.
- APIs: No production API contract changes are intended; this change adds automated verification around the existing `/api/users/*` endpoints.
