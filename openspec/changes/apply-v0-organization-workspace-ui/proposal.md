## Why

The owner organization workspace currently renders only a placeholder, while the v0 design already defines the intended organization management experience. Implementing that proposal now gives organization owners a usable hub for institutional data, members, departments, and document assets before API wiring is added.

## What Changes

- Replace the placeholder `OwnerOrganizationWorkspace` with the same main `/organizacao` UI proposed in v0 chat `dBy5w4jPvHh`, excluding the v0 sidebar.
- Use local mock data and client-side state for tabs, form edits, invite/member interactions, department management, and document upload previews.
- Keep the implementation disconnected from organization, members, invites, departments, and upload APIs for this step.
- Preserve the owner-only route surface already used by `/app/organizacao`.

## Capabilities

### New Capabilities
- `owner-organization-workspace-ui`: owner-facing organization workspace UI with overview metrics and tabs for prefeitura data, members/invites, departments, and institutional documents.

### Modified Capabilities

None.

## Impact

- Affected web code: `apps/web/src/modules/organizations/ui/owner-organization-workspace.tsx`, related owner organization page tests, and shared theme tokens if needed for v0 semantic colors.
- Affected APIs: none in this change; all interactions remain local/mock-only.
- Affected dependencies: none expected; the existing web package already includes React, Tailwind, and `lucide-react`.
