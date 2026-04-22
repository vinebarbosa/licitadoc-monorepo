## 1. E2E Fixture Setup

- [x] 1.1 Extend the shared API E2E helpers with the department, organization, actor, and cleanup fixtures needed for admin, organization-owner, and member department scenarios
- [x] 1.2 Reuse the existing HTTP server, auth-session, cookie, and database helpers so the department-management suite shares the current `apps/api` E2E harness
- [x] 1.3 Ensure the department-management suite runs under the existing `apps/api` `test:e2e` command with isolated database state

## 2. Department Management Coverage

- [x] 2.1 Add the admin E2E scenario for creating a department in any organization and asserting the persisted department record
- [x] 2.2 Add E2E coverage for organization-owner department creation inside the owned organization and rejection for cross-organization or missing-scope creation attempts
- [x] 2.3 Add E2E coverage for admin, organization-owner, and member department listings, including the empty-list behavior for non-admin actors without organization scope
- [x] 2.4 Add E2E coverage for scoped department detail reads, including rejection for member detail access and owner reads outside the owned organization
- [x] 2.5 Add E2E coverage for admin and same-organization owner department updates and assert persisted name, slug, and responsible authority changes
- [x] 2.6 Add negative E2E scenarios for unauthenticated or member create and update attempts, out-of-scope owner updates, and same-organization slug conflicts on create or update

## 3. Verification

- [x] 3.1 Update API E2E documentation if the department-management suite adds fixture or environment requirements worth calling out for local and CI runs
- [x] 3.2 Run `pnpm test:e2e` in `apps/api` and confirm the auth, invite, user-management, organization-management, and department-management E2E suites pass together
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the department-management E2E changes land
