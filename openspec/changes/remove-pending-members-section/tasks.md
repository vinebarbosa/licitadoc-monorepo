## 1. Owner member page simplification

- [x] 1.1 Remove the pending invite list query usage from `OwnerMembersPageContent` when it only supports the removed pending section.
- [x] 1.2 Remove the `PendingInviteRow` component and the standalone pending invites rendering block from the owner members UI.
- [x] 1.3 Keep member invite creation, success/error handling, and members-list invalidation intact.

## 2. Tests and fixtures

- [x] 2.1 Update owner members page tests so they no longer expect the "Convites pendentes" section.
- [x] 2.2 Add or adjust coverage proving pending-profile members still render in the members table.
- [x] 2.3 Add or adjust coverage proving invite creation refreshes the members table without rendering a pending section.

## 3. Verification

- [x] 3.1 Run focused owner members page tests.
- [x] 3.2 Run frontend typecheck or the closest scoped validation for touched files.
- [x] 3.3 Run OpenSpec status for `remove-pending-members-section` and confirm artifacts are complete.
