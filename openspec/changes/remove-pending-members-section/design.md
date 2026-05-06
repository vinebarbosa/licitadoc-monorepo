## Context

The owner organization administration page currently has a Members tab with the members table, invite creation, and a secondary "Convites pendentes" section. Recent member invite changes provision invited members as real `member` users in `pending_profile`, and the members table already renders those users when the users API returns them. That makes the separate pending invite section redundant for the requested UI.

The page should continue to let organization owners create member invites. The change is only about removing the standalone pending section from the UI, not changing invite lifecycle storage or invite delivery behavior.

## Goals / Non-Goals

**Goals:**
- Remove the standalone pending members/invites section from the owner administration Members tab.
- Keep the members table as the single visible list of same-organization members, including pending-profile members returned by `/api/users`.
- Keep member invite creation working and keep the users query refreshed after invite creation.
- Remove frontend tests that assert the pending section is shown or hidden.

**Non-Goals:**
- Removing the member invite creation dialog.
- Changing backend invite persistence, invite status, invite e-mail delivery, or onboarding behavior.
- Hiding provisioned pending-profile member users from the members table.
- Redesigning the Departments tab or the owner administration page structure.

## Decisions

### Treat the members table as the only member visibility surface
The Members tab will no longer render the pending invite card/section. Same-organization member users, including invited users in pending onboarding states, remain visible through the members table.

Rationale:
- Provisioned invites already create user rows, so the members table is the product-facing source of truth.
- Removing the secondary section reduces duplication and keeps the page focused on one member list.

Alternatives considered:
- Keep the section but hide it when matching pending users exist: rejected because it keeps a special-case visual surface that the request explicitly wants removed.
- Replace the section with a status column in this change: rejected because the request is removal, and status-display design can be handled separately if needed.

### Stop loading pending invite list data solely for the removed section
If no other owner page behavior depends on the invite list query, the implementation should remove the `useOwnerInvitesList` call from the page. The invite creation mutation may continue to invalidate invite queries if shared adapters already do so, but the page should not render or wait on invite-list state.

Rationale:
- Removing the visible section should also remove unnecessary network and loading behavior from the page.
- Keeping the create mutation behavior conservative avoids changing shared cache behavior more than needed.

Alternatives considered:
- Keep fetching invites even though the section is gone: rejected because it preserves hidden work with no visible owner value.

## Risks / Trade-offs

- [Owners lose visible invite lifecycle details] -> Pending provisioned users remain visible in the members table; future invite lifecycle actions can introduce a purpose-built design if needed.
- [Tests still wait for invite list requests] -> Update page tests to focus on members, invite creation, and absence of the pending section.
- [Invite create cache behavior becomes broader than current page needs] -> Keep invalidation harmless unless implementation finds it creates stale or noisy behavior.

## Migration Plan

No data migration is required. Rollout is frontend-only: remove the section and associated page query/test expectations. Rollback is simple: restore the pending section and its invite-list query.

## Open Questions

None.
