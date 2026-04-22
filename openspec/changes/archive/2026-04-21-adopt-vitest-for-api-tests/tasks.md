## 1. Vitest Setup

- [x] 1.1 Add Vitest to `apps/api` and create the config needed to run module tests from `src/**/*.test.ts`
- [x] 1.2 Add the dedicated E2E Vitest configuration or override path for `test/**/*.test.ts`
- [x] 1.3 Update `apps/api/package.json` scripts so the package exposes `test` and `test:e2e`

## 2. Test Migration

- [x] 2.1 Migrate the existing API module test files from `node:test` and `node:assert/strict` to Vitest-compatible imports and assertions
- [x] 2.2 Migrate the auth E2E suite and helpers to Vitest-compatible test APIs without changing the existing E2E coverage behavior
- [x] 2.3 Remove leftover runner-specific references to `tsx --test` or `test:auth-e2e` from API test-related code and docs

## 3. Verification

- [x] 3.1 Update the repository instructions for running API tests locally and in CI with `pnpm test` and `pnpm test:e2e`
- [x] 3.2 Run `pnpm test` and `pnpm test:e2e` in `apps/api` and confirm both suites pass under Vitest
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck` in `apps/api` after the migration
