# api-test-tooling Specification

## Purpose
TBD - created by archiving change adopt-vitest-for-api-tests. Update Purpose after archive.
## Requirements
### Requirement: API module tests MUST run through Vitest behind the standard test command
The `apps/api` package MUST expose a `test` command that runs the package's module and service-level test files through Vitest without pulling in the API E2E suite.

#### Scenario: Running module tests
- **WHEN** a developer runs `pnpm test` inside `apps/api`
- **THEN** Vitest executes the test files under `src/**/*.test.ts`
- **AND** the command excludes E2E-only files under `test/**`

### Requirement: API end-to-end tests MUST run through Vitest behind a dedicated E2E command
The `apps/api` package MUST expose a `test:e2e` command that runs the API end-to-end test suite through Vitest while preserving the isolated execution path needed by database-backed HTTP tests.

#### Scenario: Running API E2E tests
- **WHEN** a developer runs `pnpm test:e2e` inside `apps/api`
- **THEN** Vitest executes the E2E test files under `test/**/*.test.ts`
- **AND** the command does not also execute the module test files under `src/**`

### Requirement: Existing API automated coverage MUST remain expressible under the Vitest runner
The API package MUST keep its existing module-test and auth E2E coverage runnable after the migration by expressing the tests with Vitest-compatible suites, hooks, and assertions.

#### Scenario: Migrated auth and module suites still run
- **WHEN** the API package test files are migrated to Vitest
- **THEN** the existing module-level coverage and auth E2E coverage still run under the new runner without requiring `node:test`

### Requirement: API test documentation MUST reference the standardized commands
The repository documentation for `apps/api` test execution MUST describe the Vitest-based `test` and `test:e2e` commands instead of the previous ad hoc E2E command name.

#### Scenario: Reading the API E2E runbook
- **WHEN** a developer follows the repository instructions for the API auth E2E flow
- **THEN** the documented command to run the suite is `pnpm test:e2e`

