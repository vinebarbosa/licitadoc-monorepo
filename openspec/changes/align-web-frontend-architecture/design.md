## Context

`apps/web/agents.md` and `apps/web/architecture.md` define the intended frontend structure: app-wide composition in `src/app`, product and public workflows in `src/modules`, reusable UI and utilities in `src/shared`, frontend test infrastructure in `src/test`, and browser tests in `e2e`. The archived `define-web-frontend-architecture`, `migrate-web-design-system`, `migrate-landing-page`, `migrate-web-auth-flow`, and admin/user changes have already established many of these pieces, but the live source tree still needs a single architecture-alignment pass before more workflows are added on top.

The implementation should treat the existing docs as the source of truth and preserve current user-facing behavior while reorganizing or tightening code boundaries. This is especially important because recent migrated screens use shared UI primitives, React Router routes, generated-client backed adapters, MSW handlers, and Playwright smoke tests together.

## Goals / Non-Goals

**Goals:**

- Verify the live `apps/web` source tree matches the package-local architecture and agent guide.
- Keep app composition concerns in `src/app`, including providers, query client setup, route guards, theme setup, and router creation.
- Keep public and product pages under module ownership and expose only intentional public APIs from module `index.ts` files or documented route exports.
- Keep generated API client usage inside app infrastructure or module `api` adapters, with product UI consuming module-level hooks and model helpers.
- Remove runtime imports from `tmp`, legacy design-system aliases, and private cross-module folders.
- Update or add focused Vitest, MSW, and Playwright coverage for the aligned routes and adapters.
- Run the documented web validation commands after implementation.

**Non-Goals:**

- Redesign the frontend visual language or replace the existing shared design-system primitives.
- Change backend route schemas, generated OpenAPI output, or generated API client files unless a real stale-contract issue is discovered.
- Add new product workflows beyond the minimum needed to make current routes and modules conform.
- Introduce a new state-management, routing, testing, or data-fetching framework.

## Decisions

### Treat `apps/web/architecture.md` as the implementation checklist

The implementation should start by comparing current files and imports to the architecture document rather than inventing new boundaries. This keeps the change anchored to the already accepted source layout and avoids creating a second architecture while trying to enforce the first one.

Alternative considered: refactor by feature area first and document afterward. That risks moving code according to short-term screen needs instead of the package-level rules contributors are expected to follow.

### Preserve centralized router composition

`src/app/router.tsx` should remain the visible place where application routes are composed. Modules can export page entrypoints or route definitions, but reusable module logic should stay inside the module instead of accumulating in the router.

Alternative considered: let each module register itself globally. That would hide route behavior and add indirection before the app needs it.

### Use module public APIs as the cross-boundary contract

Cross-module consumers should import from `src/modules/<module>/index.ts` or a documented route export. Imports from another module's `api`, `model`, `ui`, or `pages` folders should be treated as architecture drift and moved behind public exports or kept local to the owning module.

Alternative considered: allow direct private imports for convenience. That makes module internals hard to change and undermines the architecture the docs describe.

### Keep generated-client details inside adapters

Generated endpoint hook names and query keys can appear in module `api` folders and app infrastructure, but page and UI components should usually consume product-named module hooks and model helpers. MSW handlers and fixtures should be updated alongside backend-backed UI changes so tests continue exercising the same boundary.

Alternative considered: import generated hooks directly in each page. That speeds up a single screen, but spreads backend naming and cache behavior through product UI.

### Validate conformance with targeted checks

The implementation should use existing validation commands and lightweight static searches for temporary aliases, runtime `tmp` imports, generated-file edits, and private cross-module imports. Tests should focus on representative route behavior and module adapters instead of snapshotting folder structure.

Alternative considered: add a custom architectural lint rule now. That may become useful later, but a focused migration pass plus documented checks is enough for this change and avoids new tooling churn.

## Risks / Trade-offs

- [Risk] Existing dirty workspace changes may already contain partial migrations. -> Reconcile with the current source tree and avoid reverting unrelated work.
- [Risk] Moving imports behind public module APIs can create cycles if exports are too broad. -> Keep public exports small and move only true cross-boundary needs into `index.ts`.
- [Risk] Route preservation can be ambiguous when legacy smoke pages and new product routes compete for `/`. -> Keep current route behavior covered by tests before and after the alignment pass.
- [Risk] API adapter cleanup may expose stale generated-client contracts. -> Regenerate the API client only if backend schema changes or generated types are actually out of date.
- [Risk] Static import searches can miss dynamic or indirect boundary violations. -> Pair searches with code review of router, modules, shared UI, and tests touched by the change.

## Migration Plan

1. Inventory the current `apps/web` tree, route map, module exports, generated-client imports, MSW handlers, and Playwright/Vitest coverage.
2. Reclassify misplaced code into `src/app`, `src/modules`, `src/shared`, `src/test`, or `e2e` according to `apps/web/architecture.md`.
3. Tighten module public APIs and update cross-boundary imports to use those APIs.
4. Move generated-client usage behind module `api` adapters where product UI currently depends on generated endpoint details.
5. Remove runtime temporary or legacy imports and update tests/mocks for any changed routes or backend-backed behavior.
6. Run the documented frontend validation commands and fix regressions before considering the alignment complete.
