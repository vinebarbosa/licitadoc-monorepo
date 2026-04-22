## Why

The `organizations` module already has service-level coverage and approved behavior, but it still lacks API end-to-end tests for the real onboarding and management flows. That leaves creation, listing, reads, and updates exposed to regressions in session auth, actor scope, route validation, and persisted organization state that unit tests would not catch.

## What Changes

- Add API E2E tests for organization onboarding creation through real authenticated sessions.
- Add API E2E tests for organization listing and detail reads with `admin` and `organization_owner` visibility rules.
- Add API E2E tests for organization updates, including persisted field changes and the `organization_owner` restriction around admin-only fields.
- Add the fixture setup and cleanup needed to create organization owners, admins, and organization records inside the isolated E2E database.
- Extend the API E2E runbook as needed so organization-management coverage runs alongside the existing auth, invite, and user suites.

## Capabilities

### New Capabilities
- `organization-e2e-coverage`: Covers API-level end-to-end verification of organization onboarding, listing, detail reads, and update flows in `apps/api`.

### Modified Capabilities

## Impact

- Affected code: `apps/api/test/**` E2E suites and helpers, organization-related fixture setup, and repository documentation for API E2E execution.
- Systems: Dedicated E2E database state will include organization and user fixtures needed to exercise onboarding and organization-management scope.
- APIs: No production API contract changes are intended; this change adds automated verification around the existing `/api/organizations/*` endpoints.
