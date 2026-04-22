## Why

The `apps/api` package currently runs module tests and auth E2E tests through `tsx --test` and `node:test`, with a separate `test:auth-e2e` command for the newer HTTP flow coverage. This keeps the API on a lower-level runner API, makes test authoring less ergonomic as coverage grows, and leaves the package without the more conventional `test` plus `test:e2e` workflow the team wants to standardize on now.

## What Changes

- Adopt Vitest as the test runner for `apps/api` module tests and API E2E tests.
- Replace the dedicated `test:auth-e2e` command with a standardized `test:e2e` command for the API package.
- Introduce the Vitest configuration needed to keep fast module tests and slower E2E tests isolated while still sharing the same runner.
- Migrate existing `node:test`-style API tests to Vitest-compatible test files and assertions.
- Update local and CI documentation for the new API test commands and any required Vitest-specific configuration.

## Capabilities

### New Capabilities
- `api-test-tooling`: Covers running `apps/api` automated tests through Vitest with dedicated `test` and `test:e2e` commands.

### Modified Capabilities

## Impact

- Affected code: `apps/api/package.json`, API test files in `apps/api/src/**` and `apps/api/test/**`, new Vitest config files, and documentation that references the old commands.
- Tooling: Adds Vitest to `apps/api` and may remove or reduce reliance on `tsx --test` for test execution.
- CI and local workflows: Existing test invocations must move to `pnpm test` and `pnpm test:e2e` in `apps/api`.
