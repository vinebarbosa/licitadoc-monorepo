## 1. Backend contract and coverage

- [x] 1.1 Audit the owner-scoped `/api/users` and `/api/invites` contracts and extend route schemas only if the owner page needs additional fields or filters.
- [x] 1.2 Add or update API tests proving organization owners can list scoped members, list scoped invites, create member invites, and update or delete same-organization members for the new workflow.
- [x] 1.3 Regenerate `@licitadoc/api-client` if any backend route schema changes are introduced while supporting the owner page.

## 2. Owner routing and navigation

- [x] 2.1 Add an owner-only `/app/membros` route with breadcrumbs and authorization behavior aligned with the existing app-shell guards.
- [x] 2.2 Add a sidebar navigation entry that exposes the new page only to `organization_owner` users.

## 3. Owner member management page

- [x] 3.1 Add owner-focused query and mutation adapters in `apps/web/src/modules/users` for scoped members, pending invites, invite creation, member updates, and member deletion.
- [x] 3.2 Implement the owner member management page UI, modeled after the admin users page but scoped to member access, including loading, empty, and error states.
- [x] 3.3 Implement the owner workflows for creating member invites and managing visible members with success/error feedback and query invalidation.

## 4. Verification

- [x] 4.1 Add or update web tests for route protection, sidebar visibility, scoped data rendering, and owner member-management actions.
- [x] 4.2 Run focused backend and frontend validation for the owner member-management flow and address any regressions discovered.