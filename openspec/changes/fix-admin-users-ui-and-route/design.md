## Context

The admin users area already exists in `apps/web`, but it is currently mounted under `/app/admin/usuarios`, the sidebar points to that path, and the page composition no longer matches the legacy operational screen in `/tmp/usuarios.tsx`. The backend contracts, generated client, and admin-only actions are already in place; this change is about correcting the route contract and bringing the migrated UI back in line with the expected administrative workflow.

The main constraints are:
- the page must continue using the current roles (`admin`, `organization_owner`, `member`) and the existing invites/users/organizations endpoints;
- the route must become `/admin/usuarios` without losing the authenticated shell experience;
- the redesign should improve parity with the legacy screen without reintroducing mock data, obsolete roles, or direct-user-creation flows.

## Goals / Non-Goals

**Goals:**
- Make `/admin/usuarios` the canonical route for the admin users experience.
- Preserve session enforcement, admin-only authorization, and app-shell navigation around that route.
- Recompose the page so its hierarchy and controls are visually closer to the legacy `/tmp/usuarios.tsx` screen while staying grounded in the current product model.
- Keep filters, pagination, invite provisioning, update flows, and delete flows working with the existing API contracts.
- Update navigation and tests to validate the new route and refreshed administrative presentation.

**Non-Goals:**
- Changing backend route schemas or adding new admin-only endpoints.
- Reintroducing legacy domain roles such as `SUPER_ADMIN`, `ORG_ADMIN`, or `USER`.
- Implementing direct user creation outside the existing invite flow.
- Reworking unrelated app-shell routes or redesigning non-admin pages.

## Decisions

### 1. Promote the admin users page to a top-level protected route branch

`/admin/usuarios` will become the canonical route. The router will expose a protected branch outside `/app` that still renders through the authenticated shell layout, so admins keep the same sidebar and shell chrome while the URL matches the requested entrypoint.

The old `/app/admin/usuarios` path should be treated as deprecated routing state and redirected to `/admin/usuarios` during the migration window, preventing broken bookmarks and stale tests from silently preserving the wrong contract.

Alternatives considered:
- Keep the page under `/app/admin/usuarios`: simplest implementation, but it preserves the wrong URL contract.
- Mount a second copy of the page without the app shell: achieves the URL, but regresses navigation continuity.
- Use only a navigation link update without a redirect: leaves existing deep links broken unnecessarily.

### 2. Recompose the page around the legacy operational layout while keeping current domain behavior

The page should recover the legacy information architecture from `/tmp/usuarios.tsx`: breadcrumb-aware header, summary cards, compact filter bar, denser table rows with avatar-style identity presentation, role badges, organization label, created-at date, and a condensed row-level actions affordance.

Visual parity does not mean reviving obsolete behavior. The refreshed page must keep the current domain model, so legacy labels/actions are mapped as follows:
- legacy privileged roles map to `admin` and `organization_owner` labels from the real system;
- the primary creation call-to-action still provisions `organization_owner` via invite rather than direct user creation;
- destructive affordances continue to mean actual user removal, not a new inactive-state workflow.

Alternatives considered:
- Keep the current simplified page and only move the route: fixes the URL but not the user-visible regression the request called out.
- Copy the legacy screen verbatim: would reintroduce obsolete labels, mock assumptions, and actions unsupported by the current backend.

### 3. Preserve URL-driven list state and existing data adapters

The current list behavior already uses query parameters and real API hooks. That model should stay in place so route migration and visual refactor do not regress shareable filters, pagination restoration, or query scoping. The UI refresh is therefore a presentation and routing change over the existing users, organizations, and invites data flows.

This also keeps the change narrowly scoped: no new backend work is required, and validation can stay focused on router behavior, sidebar links, and the page itself.

Alternatives considered:
- Introduce a new page-local state model detached from the URL: would reduce parity with the current implementation and lose direct-link behavior.
- Bundle additional admin aggregate data into new endpoints: unnecessary for a route/layout correction.

### 4. Update navigation and tests around the canonical route

The sidebar admin link, route tests, and page tests must all adopt `/admin/usuarios` as the canonical admin users path. Coverage should also assert that admin sessions reach the page at the new route and that any compatibility redirect from `/app/admin/usuarios` lands on the canonical path.

Alternatives considered:
- Update only the router and rely on manual verification: too easy to miss stale links and path assumptions.

## Risks / Trade-offs

- **[Duplicating shell-protected routing branches can drift over time]** -> Mitigate by reusing the same guard/layout composition used by the `/app` branch instead of introducing separate auth logic.
- **[Visual parity can conflict with current reusable components]** -> Mitigate by matching the legacy layout with shared primitives and current tokens rather than copying obsolete code directly.
- **[Changing the canonical route can break existing bookmarks or tests]** -> Mitigate by updating navigation/tests together and keeping a compatibility redirect from the old path during migration.
- **[A closer visual match may expose more page chrome than the current simplified version]** -> Mitigate by keeping the scope limited to the admin users workflow and validating mobile/desktop behavior after the composition change.

## Migration Plan

1. Move the canonical admin users route to `/admin/usuarios`, add a compatibility redirect from `/app/admin/usuarios`, and update the admin navigation entry.
2. Refactor `AdminUsersPage` to restore the legacy operational layout using current shared UI primitives and existing data hooks.
3. Refresh router and page tests to cover the new canonical route, redirected legacy path, and the preserved URL-driven filters.
4. Validate the touched web slice with focused tests and static checks.

Rollback:
- Remove the new top-level admin route branch and restore `/app/admin/usuarios` as the canonical path.
- Revert the page composition changes if the legacy-aligned layout introduces regressions.

## Open Questions

None.