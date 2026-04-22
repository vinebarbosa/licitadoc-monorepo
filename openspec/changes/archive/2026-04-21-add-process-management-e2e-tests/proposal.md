## Why

The `processes` module already has service-level coverage and approved behavior, but it still lacks API end-to-end tests for the real process-management flows. That leaves process creation, listing, detail reads, and updates exposed to regressions in session auth, organization scoping, department-link validation, conflict translation, and persisted process state that unit tests would not catch.

## What Changes

- Add API E2E tests for process creation through real authenticated sessions, including `admin`, `organization_owner`, and `member` creation rules.
- Add API E2E tests for process listing and detail reads with `admin`, `organization_owner`, and `member` visibility rules.
- Add API E2E tests for process updates, including persisted field changes, department link resynchronization, and preservation of existing document ownership.
- Add API E2E tests for failure paths such as foreign department ids, duplicate `processNumber` in the same organization, unauthenticated access, and out-of-scope reads or updates.
- Add the fixture setup and cleanup needed to create admins, organization owners, members, organizations, departments, processes, process-department links, and document records inside the isolated E2E database.
- Extend the API E2E runbook as needed so process-management coverage runs alongside the existing auth, invite, user, organization, and department suites.

## Capabilities

### New Capabilities
- `process-e2e-coverage`: Covers API-level end-to-end verification of process creation, listing, detail reads, and update flows in `apps/api`, including department link synchronization and preserved document ownership.

### Modified Capabilities

## Impact

- Affected code: `apps/api/test/**` E2E suites and helpers, process-related fixture setup, and repository documentation for API E2E execution.
- Systems: Dedicated E2E database state will include organization, user, department, process, process-department, and document fixtures needed to exercise process-management scope.
- APIs: No production API contract changes are intended; this change adds automated verification around the existing `/api/processes/*` endpoints.
