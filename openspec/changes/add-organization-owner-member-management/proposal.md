## Why

Organization owners can already invite members and manage same-organization members through the existing backend authorization rules, but the web app does not expose a dedicated management page for that workflow. This keeps member access provisioning dependent on hidden endpoints or admin-oriented screens, slowing onboarding and day-to-day access control for each organization.

## What Changes

- Add an organization-owner member management experience in the authenticated web app, modeled after the existing admin users page but scoped to the current owner's organization.
- Let organization owners view active members and pending member invites in one management workflow, create new member invites, and perform allowed member actions without leaving the owner workspace.
- Wire the frontend to the existing owner-scoped user and invite APIs, and close any backend gaps needed to support the page contract, API documentation, and generated client usage.
- Add focused backend and frontend test coverage for the new route, owner-only navigation, scoped data loading, and permitted member management actions.

## Capabilities

### New Capabilities
- `owner-member-management`: organization owners can manage same-organization member access from a dedicated web page that combines member visibility, pending invites, and allowed access actions.

### Modified Capabilities

None.

## Impact

- Affected web areas: authenticated router, app-shell navigation, owner-facing member management page/components/hooks, and route tests in `apps/web`.
- Affected backend areas: owner-scoped invite and user management flows, route schema/client alignment, and focused coverage in `apps/api`.
- Affected APIs: `GET /api/users`, `PATCH /api/users/:userId`, `DELETE /api/users/:userId`, `GET /api/invites`, and `POST /api/invites` as consumed by organization owners.
- Affected tooling: `@licitadoc/api-client` may need regeneration if route schemas change while aligning the owner page contract.