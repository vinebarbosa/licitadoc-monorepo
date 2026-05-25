## Why

Organization users land on the Central de Trabalho, but the quick actions only cover document generation. For prefeitura operators, especially organization owners, the central should also surface the day-to-day organization management actions they already use under `/app/organizacao`.

## What Changes

- Add a prefeitura-focused quick action group to the Central de Trabalho for authenticated non-admin users with an organization.
- Show organization-owner actions that deep-link into the existing organization management workspace: prefeitura data, member invitations, departments, and institutional documents.
- Keep platform admins on the current administrative experience without prefeitura quick actions.
- Prevent member users from seeing owner-only management links unless a target route is authorized for that role.
- Preserve the existing document quick actions, process loading/error states, and Central de Trabalho layout density.

## Capabilities

### New Capabilities
- `work-center-prefeitura-quick-actions`: role-aware Central de Trabalho quick actions for prefeitura users, with owner-only shortcuts into organization management.

### Modified Capabilities

None.

## Impact

- Affected web code: `apps/web/src/modules/app-shell/pages/app-home-page.tsx`, its tests, and auth/session usage in the app-shell module.
- Affected routes: owner-only links to `/app/organizacao`, ideally with tab-friendly URLs or state for direct navigation into organization sections.
- Affected APIs: none expected; the change should consume the current auth session and existing organization workspace route.
- Affected dependencies: none expected.
