## Why

The invite module already has solid service-level tests and approved requirements, but it still lacks API-level end-to-end coverage for the real HTTP flows. That leaves create, list, preview, and accept invite behavior exposed to regressions in auth sessions, route wiring, authorization, and database persistence that unit tests would not catch.

## What Changes

- Add API E2E tests for privileged invite creation and invite listing using real authenticated sessions.
- Add API E2E tests for invite preview and acceptance, including the invited user's role and organization assignment after redemption.
- Add the E2E fixtures and database cleanup needed to seed organizations and promote test users into the roles required by invite scenarios.
- Extend the API E2E runbook as needed so invite coverage remains runnable locally and in CI alongside the existing auth suite.

## Capabilities

### New Capabilities
- `invite-e2e-coverage`: Covers API-level end-to-end verification of invite creation, listing, preview, and acceptance flows in `apps/api`.

### Modified Capabilities

## Impact

- Affected code: `apps/api/test/**` E2E suites and helpers, invite-related setup/cleanup utilities, and repository documentation for API E2E execution.
- Systems: Dedicated E2E database state will now include invite, user, and organization fixtures needed for invite journeys.
- APIs: No production API contract changes are intended; this change adds automated verification around existing invite endpoints.
