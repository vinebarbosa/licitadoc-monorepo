## 1. Documentation

- [x] 1.1 Add `apps/web/architecture.md` describing the frontend package role, modular architecture, current stack, source layout, responsibility boundaries, and backend/API-client relationship.
- [x] 1.2 Add `apps/web/agents.md` as a separate operational guide with commands, workflow expectations, generated-file rules, module boundaries, and validation steps.
- [x] 1.3 Document conventions for `src/app`, `src/modules`, `src/shared`, `src/test`, `e2e`, generated API hook usage, module adapters, query/mutation wrappers, and contract regeneration.

## 2. Modular Source Layout

- [x] 2.1 Create the initial `apps/web/src/app` structure for app-wide provider, query client, router, route guard, and environment composition.
- [x] 2.2 Move QueryClientProvider setup into app-level composition while preserving the existing React root behavior.
- [x] 2.3 Move router creation into the app/router boundary and keep route composition centralized.
- [x] 2.4 Create a minimal `apps/web/src/modules` structure using modules as product boundaries without adding empty speculative implementations for every backend area.
- [x] 2.5 Keep module internals private by convention and expose only documented public exports or route entrypoints.
- [x] 2.6 Keep the current home route functional after any file moves.

## 3. API and Shared Boundaries

- [x] 3.1 Introduce a small module-level API/session or health adapter where it clarifies the current smoke screen and generated client usage.
- [x] 3.2 Ensure product workflow code lives in modules and reusable UI/utilities live under shared boundaries only when independent of a specific module.
- [x] 3.3 Confirm generated client imports are isolated to app infrastructure, module API adapters, or temporary smoke code.

## 4. Test Tooling

- [x] 4.1 Add Vitest, Testing Library, happy-dom, and related frontend test setup for unit/component tests in `@licitadoc/web`.
- [x] 4.2 Add package scripts for Vitest tests and update documentation with the command names.
- [x] 4.3 Add MSW setup with shared handlers for current health/session responses and a structure for future module handlers.
- [x] 4.4 Add Playwright configuration for browser route/e2e smoke tests against the Vite app.
- [x] 4.5 Add package scripts for Playwright tests and update documentation with the command names.
- [x] 4.6 Add at least one Vitest route/component smoke test using MSW.
- [x] 4.7 Add at least one Playwright route smoke test that validates the app boots and renders the current route deterministically.

## 5. Validation

- [x] 5.1 Run `pnpm --filter @licitadoc/web typecheck` and fix any TypeScript issues caused by the architecture changes.
- [x] 5.2 Run `pnpm --filter @licitadoc/web lint` and fix any Biome issues caused by the architecture changes.
- [x] 5.3 Run the new `@licitadoc/web` Vitest command and fix any unit/component test issues.
- [x] 5.4 Run the new `@licitadoc/web` Playwright command and fix any browser test issues.
- [x] 5.5 Review the final file tree against `apps/web/architecture.md` and `apps/web/agents.md` to confirm the documentation describes the implementation that landed.
