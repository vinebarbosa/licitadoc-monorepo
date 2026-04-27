## Why

The administrative users screen was implemented with real data, but the resulting experience diverged visibly from the legacy reference in `/tmp/usuarios.tsx`. It also ships under `/app/admin/usuarios`, while the expected entrypoint for this area is `/admin/usuarios`, which creates the wrong URL contract for admins and keeps the migrated experience out of alignment with the requested navigation model.

## What Changes

- Move the administrative users experience to the dedicated route `/admin/usuarios` while preserving session enforcement, admin-only authorization, and the authenticated shell context.
- Rework the admin users page so its visual hierarchy, stats summary, filters, table presentation, action affordances, loading skeleton, empty state, and pagination more closely match the legacy `/tmp/usuarios.tsx` screen.
- Keep the current domain model and real backend integrations, mapping the legacy concepts onto the current roles and invite-based provisioning flow instead of reintroducing mock-only behavior.
- Update navigation, route coverage, and page tests so the new route and the refreshed admin experience remain validated.

## Capabilities

### New Capabilities
- `web-admin-user-management`: Defines the admin-only users management experience, including the expected `/admin/usuarios` route and the legacy-aligned visual structure backed by real application data.

### Modified Capabilities
None.

## Impact

- Affected code: `apps/web/src/app/router.tsx`, `apps/web/src/modules/app-shell`, `apps/web/src/modules/users/**`, related frontend tests, and OpenSpec artifacts for the admin users experience.
- APIs: no new backend endpoints are required; the existing users, organizations, and invites contracts remain the data source.
- Systems: admin navigation, protected routing, and the visual/admin workflow in the web application.