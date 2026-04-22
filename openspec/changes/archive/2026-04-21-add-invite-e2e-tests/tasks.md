## 1. E2E Fixture Setup

- [x] 1.1 Add shared E2E helpers for seeding organizations, promoting fixture users to privileged roles, and cleaning invite-related auth data
- [x] 1.2 Reuse or generalize the existing HTTP server and cookie-jar helpers so invite E2E tests can share the current API E2E harness
- [x] 1.3 Ensure the invite suite runs under the existing `apps/api` `test:e2e` command with isolated database state

## 2. Invite Flow Coverage

- [x] 2.1 Add the admin happy-path E2E scenario for creating an organization-owner invite and verifying it through the list endpoint
- [x] 2.2 Add the organization-owner happy-path E2E scenario for creating a member invite and verifying organization-scoped list visibility
- [x] 2.3 Add E2E coverage for invite token preview using the token returned by the create route
- [x] 2.4 Add E2E coverage for accepting a valid invite as the matching authenticated user and asserting the resulting invite status plus stored user role and organization
- [x] 2.5 Add negative E2E scenarios for unauthorized create/list access and mismatched-email invite acceptance

## 3. Verification

- [x] 3.1 Update API E2E documentation if the invite suite adds fixture or environment requirements worth calling out for local and CI runs
- [x] 3.2 Run `pnpm test:e2e` in `apps/api` and confirm the auth and invite E2E suites pass together
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the invite E2E changes land
