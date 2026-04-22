## Why

The `departments` module already has service-level coverage and approved behavior, but it still lacks API end-to-end tests for the real management flows. That leaves department creation, listing, detail reads, and updates exposed to regressions in session auth, organization scoping, route validation, and persisted department state that unit tests would not catch.

## What Changes

- Add API E2E tests for department creation through real authenticated sessions, including `admin` and `organization_owner` creation rules.
- Add API E2E tests for department listing and detail reads with `admin`, `organization_owner`, and `member` visibility rules.
- Add API E2E tests for department updates, including persisted profile changes and rejection of out-of-scope or disallowed actors.
- Add the fixture setup and cleanup needed to create admins, organization owners, members, organizations, and department records inside the isolated E2E database.
- Extend the API E2E runbook as needed so department-management coverage runs alongside the existing auth, invite, user, and organization suites.

## Capabilities

### New Capabilities
- `department-e2e-coverage`: Covers API-level end-to-end verification of department creation, listing, detail reads, and update flows in `apps/api`.

### Modified Capabilities

## Impact

- Affected code: `apps/api/test/**` E2E suites and helpers, department-related fixture setup, and repository documentation for API E2E execution.
- Systems: Dedicated E2E database state will include organization, user, and department fixtures needed to exercise department-management scope.
- APIs: No production API contract changes are intended; this change adds automated verification around the existing `/api/departments/*` endpoints.
