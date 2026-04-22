## 1. E2E Fixture Setup

- [x] 1.1 Extend the shared API E2E helpers with the user and organization fixtures needed to create admin, organization-owner, member, and managed-user scenarios
- [x] 1.2 Reuse the existing HTTP server, auth-session, and cleanup helpers so the user-management suite shares the current `apps/api` E2E harness
- [x] 1.3 Ensure the user-management suite runs under the existing `apps/api` `test:e2e` command with isolated database state

## 2. User Management Coverage

- [x] 2.1 Add the admin E2E scenario for listing users across organizations and reading a target user's detail
- [x] 2.2 Add the organization-owner E2E scenarios for listing only same-organization users and rejecting reads outside that scope
- [x] 2.3 Add E2E coverage for admin-managed user updates and assert the persisted role or organization changes after the PATCH request
- [x] 2.4 Add E2E coverage for organization-owner management of a same-organization member, including one allowed update and a successful deletion flow
- [x] 2.5 Add negative E2E scenarios for unauthenticated or member access and for organization-owner attempts to manage users outside allowed scope

## 3. Verification

- [x] 3.1 Update API E2E documentation if the user-management suite adds fixture or environment requirements worth calling out for local and CI runs
- [x] 3.2 Run `pnpm test:e2e` in `apps/api` and confirm the auth, invite, and user-management E2E suites pass together
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the user-management E2E changes land
