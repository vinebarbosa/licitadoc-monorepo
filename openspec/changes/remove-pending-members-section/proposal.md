## Why

The owner organization administration page currently surfaces pending invite/member context in a separate section below the members list. That extra section is no longer desired because pending invited users are already represented through the members table once provisioned, and keeping a second pending area adds visual noise.

## What Changes

- Remove the pending members/invites section from the owner organization administration page.
- Preserve the member invite creation flow and the members table refresh behavior after a new invite is created.
- Keep pending/provisioned member users visible in the members table when returned by the users API.
- Remove frontend tests and copy that expect a separate "Convites pendentes" section.

## Capabilities

### New Capabilities
- `owner-member-pending-section-removal`: the owner organization administration surface no longer renders a standalone pending members/invites section while preserving invite creation and member-list visibility.

### Modified Capabilities

None.

## Impact

- Affected web areas: `apps/web/src/modules/users/ui/owner-members-page.tsx`, owner member page tests, and any MSW expectations tied only to the removed pending section.
- Affected APIs: no backend API contract change is expected. The page may stop calling `GET /api/invites/` if that endpoint is only used for the removed section.
- Affected OpenSpec areas: a focused web capability documenting that pending invite lifecycle details should not appear as a separate owner page section.
