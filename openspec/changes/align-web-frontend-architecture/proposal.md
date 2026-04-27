## Why

The frontend architecture is documented in `apps/web/agents.md`, `apps/web/architecture.md`, and the `web-frontend-architecture` spec, but the implementation needs a deliberate alignment pass so routes, modules, API adapters, shared UI, and tests consistently follow those boundaries. Doing this now prevents new migrated screens from copying temporary patterns or leaking module internals while the web app is still being shaped.

## What Changes

- Audit `apps/web` against the documented source layout and module boundary rules.
- Move or adjust frontend code so app-wide composition lives in `src/app`, product/public workflows live in `src/modules`, reusable primitives live in `src/shared`, and test infrastructure lives in `src/test` or `e2e`.
- Ensure module internals are consumed through module public APIs or documented route exports rather than private folder imports.
- Keep generated-client access isolated behind app infrastructure or module `api` adapters, updating MSW handlers when backend-backed UI behavior changes.
- Remove runtime reliance on temporary source paths such as `tmp` and legacy aliases that conflict with the modular frontend architecture.
- Preserve current route behavior and validation coverage while reorganizing code.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `web-frontend-architecture`: Adds explicit implementation-alignment requirements so the actual `apps/web` source tree must conform to the documented architecture, not only document it.

## Impact

- Affected app code: `apps/web/src/app`, especially router, providers, route guards, and app-level composition.
- Affected module code: `apps/web/src/modules/**`, including public route modules, auth, app shell, system pages, users, and future product workflow modules.
- Affected shared code: `apps/web/src/shared/**`, including reusable UI primitives, hooks, layout, and helpers.
- Affected tests: `apps/web/src/test`, module/component Vitest tests, MSW fixtures/handlers, and Playwright route coverage under `apps/web/e2e`.
- No backend API contract changes are expected unless the audit finds frontend code depending on stale generated-client contracts.
