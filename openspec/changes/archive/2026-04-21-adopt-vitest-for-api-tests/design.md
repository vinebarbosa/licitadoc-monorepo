## Context

`apps/api` currently runs all automated tests through `tsx --test`, with module tests living under `src/**/*.test.ts` and the auth E2E suite living under `test/auth-e2e/**/*.test.ts`. The package already has a useful separation between fast module tests and slower HTTP/database-backed E2E coverage, but both suites still use `node:test` and the E2E workflow is exposed through the more specific `test:auth-e2e` command.

The requested change is not to redesign the tests themselves, but to standardize how they are executed and authored: adopt Vitest for the API package, keep distinct commands for module and E2E execution, and rename the E2E entrypoint to the more general `test:e2e`.

## Goals / Non-Goals

**Goals:**
- Run `apps/api` module tests with Vitest behind `pnpm test`.
- Run `apps/api` E2E tests with Vitest behind `pnpm test:e2e`.
- Preserve the current E2E harness behavior, including booting the real Fastify app and using a dedicated database URL.
- Migrate existing API tests away from `node:test` APIs so the package uses one runner model consistently.
- Update local and CI documentation to reference the standardized commands.

**Non-Goals:**
- Migrating other packages in the monorepo to Vitest.
- Rewriting the auth E2E harness or changing its covered scenarios beyond what the runner migration requires.
- Introducing browser automation, UI testing, or workspace-wide shared Vitest infrastructure.

## Decisions

### Decision: Adopt Vitest only within `apps/api`
The package should add Vitest locally instead of introducing a workspace-wide testing migration. This keeps the change scoped to the user request and avoids coupling the API runner decision to unrelated packages.

Alternatives considered:
- Migrate the whole monorepo to Vitest at once.
  Rejected because the user asked specifically for the API package and the repo does not yet show a shared cross-package test setup.
- Keep `tsx --test` and only rename scripts.
  Rejected because the request explicitly asks to use Vitest for API tests.

### Decision: Keep separate module and E2E execution paths through dedicated Vitest commands
`pnpm test` should continue to cover `src/**/*.test.ts`, while `pnpm test:e2e` should target the E2E tree under `test/**/*.test.ts`. The cleanest implementation is a base Vitest config for API tests plus an E2E-oriented config or CLI override that narrows `include` patterns and can tune timeouts or concurrency independently.

Alternatives considered:
- Run everything through a single `vitest` command.
  Rejected because the package already distinguishes fast module tests from database-backed E2E tests, and the user explicitly wants two commands.
- Keep the old `test:auth-e2e` name.
  Rejected because the requested workflow is `test` plus `test:e2e`.

### Decision: Migrate test files to Vitest-native test and assertion APIs
Existing API tests should move from `node:test` plus `node:assert/strict` to `describe`, `test`, hooks, and `expect` from Vitest. This avoids a mixed style within the package and makes future tests consistent with the chosen runner.

Alternatives considered:
- Keep `node:assert` helpers while only changing the runner.
  Rejected because it would leave the package in an in-between state with less benefit from the migration.
- Enable global Vitest APIs immediately.
  Rejected because explicit imports match the current codebase style better and keep the migration easier to review.

### Decision: Preserve the current auth E2E harness and dedicated database contract
The E2E suite should keep the existing bootstrapping helper, cookie jar, and `AUTH_E2E_DATABASE_URL` workflow. The migration should swap the runner and command shape without changing the underlying HTTP coverage model.

Alternatives considered:
- Rebuild the E2E suite around a different transport or test framework abstraction.
  Rejected because the existing harness is already working and the requested change is about Vitest adoption and command naming.

## Risks / Trade-offs

- [Migrating every API test file introduces broad diff churn] -> Keep the change mechanical where possible and avoid refactoring production code while converting test syntax.
- [Separate Vitest configs can drift over time] -> Share common defaults in a base config and keep the E2E-specific overrides minimal.
- [Vitest defaults may run E2E files with more parallelism than desired] -> Configure the E2E command to use conservative sequencing or file parallelism settings.
- [Docs and CI may still call the old `test:auth-e2e` command] -> Update README and any pipeline references as part of the same change.

## Migration Plan

1. Add Vitest to `apps/api` and create the config needed for module and E2E execution.
2. Replace package scripts so `pnpm test` runs module tests with Vitest and `pnpm test:e2e` runs the API E2E suite with Vitest.
3. Convert existing API test files from `node:test` and `node:assert/strict` to Vitest imports and `expect` assertions.
4. Update local and CI docs that reference `tsx --test` or `test:auth-e2e`.
5. Run both Vitest commands plus lint and typecheck to confirm parity after migration.

## Open Questions

No open questions at this time. The implementation can stay scoped to `apps/api` unless the migration reveals a missing shared testing convention that warrants a later follow-up.
