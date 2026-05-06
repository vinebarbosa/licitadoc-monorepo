## Why

Organization owners already depend on stored departments when creating processes and generating documents, but the web app does not expose an owner-facing place to create or maintain those departments. This leaves a core organization setup step hidden behind API knowledge or seed data, blocking day-to-day onboarding for real organizations.

## What Changes

- Add a Departments tab to the existing owner organization administration page at `/app/membros`.
- Let organization owners view departments from their own organization and create new departments from the web app.
- Include the department fields required by the existing API contract: name, slug, optional budget unit code, responsible name, and responsible role.
- Preserve the current member management workflow as the default tab and keep the route owner-only.
- Add focused frontend tests for the tab navigation, department listing, department creation, loading/error/empty states, and member workflow regression coverage.

## Capabilities

### New Capabilities
- `owner-department-management`: organization owners can manage same-organization departments from the owner administration surface in the web app.

### Modified Capabilities

None.

## Impact

- Affected web areas: owner members page UI, a new owner-facing departments module surface, route/page tests, MSW fixtures/handlers, and possibly sidebar/breadcrumb labels if the page becomes broader than members.
- Affected APIs: existing `GET /api/departments/` and `POST /api/departments/` as consumed by organization owners.
- Affected client package: `@licitadoc/api-client` already exposes department hooks; regeneration should only be needed if the backend contract changes.
- Backend persistence and authorization are expected to remain unchanged because the existing department API already supports organization-owner scoped creation and listing.
