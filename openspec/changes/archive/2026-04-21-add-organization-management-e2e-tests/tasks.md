## 1. E2E Fixture Setup

- [x] 1.1 Extend the shared API E2E helpers with the organization, actor, and cleanup fixtures needed for admin, organization-owner-without-organization, and organization-owner-with-organization scenarios
- [x] 1.2 Reuse the existing HTTP server, auth-session, cookie, and database helpers so the organization-management suite shares the current `apps/api` E2E harness
- [x] 1.3 Ensure the organization-management suite runs under the existing `apps/api` `test:e2e` command with isolated database state

## 2. Organization Management Coverage

- [x] 2.1 Add the onboarding E2E scenario for an `organization_owner` without an organization creating an organization through `POST /api/organizations/`
- [x] 2.2 Add E2E coverage for admin organization listing and detail reads across organizations
- [x] 2.3 Add E2E coverage for organization-owner listing and detail reads limited to the owned organization, including rejection for cross-organization access
- [x] 2.4 Add E2E coverage for admin-managed organization updates and assert persisted field changes, including administrative status fields such as `isActive`
- [x] 2.5 Add E2E coverage for organization-owner updates to the owned organization and reject attempts to change admin-only fields
- [x] 2.6 Add negative E2E scenarios for disallowed onboarding attempts, repeated onboarding, and unauthenticated or out-of-scope reads and updates

## 3. Verification

- [x] 3.1 Update API E2E documentation if the organization-management suite adds fixture or environment requirements worth calling out for local and CI runs
- [x] 3.2 Run `pnpm test:e2e` in `apps/api` and confirm the auth, invite, user-management, and organization-management E2E suites pass together
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the organization-management E2E changes land
