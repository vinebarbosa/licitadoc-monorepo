## 1. E2E Fixture Setup

- [x] 1.1 Extend the shared API E2E helpers with the process, process-department, document, organization, department, actor, and cleanup fixtures needed for admin, organization-owner, and member process scenarios
- [x] 1.2 Reuse the existing HTTP server, auth-session, cookie, and database helpers so the process-management suite shares the current `apps/api` E2E harness
- [x] 1.3 Ensure the process-management suite runs under the existing `apps/api` `test:e2e` command with isolated database state

## 2. Process Management Coverage

- [x] 2.1 Add the admin E2E scenario for creating a process in any organization and asserting the persisted process row plus stored `process_departments` links
- [x] 2.2 Add E2E coverage for organization-owner and member process creation inside the owned organization and rejection for foreign organization or foreign department ids
- [x] 2.3 Add E2E coverage for admin, organization-owner, and member process listings and detail reads, including the empty-list behavior for non-admin actors without organization scope
- [x] 2.4 Add E2E coverage for admin and same-organization scoped actor process updates and assert persisted field changes plus resynchronized `departmentIds`
- [x] 2.5 Add E2E coverage proving process updates preserve existing `documents.processId` ownership for linked documents
- [x] 2.6 Add negative E2E scenarios for unauthenticated access, out-of-scope reads or updates, and same-organization `processNumber` conflicts on create or update

## 3. Verification

- [x] 3.1 Update API E2E documentation if the process-management suite adds fixture or environment requirements worth calling out for local and CI runs
- [x] 3.2 Run `pnpm test:e2e` in `apps/api` and confirm the auth, invite, user-management, organization-management, department-management, and process-management E2E suites pass together
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the process-management E2E changes land
