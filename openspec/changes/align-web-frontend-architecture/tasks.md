## 1. Architecture Inventory

- [x] 1.1 Review `apps/web/agents.md`, `apps/web/architecture.md`, and the `web-frontend-architecture` spec before editing frontend files.
- [x] 1.2 Inventory `apps/web/src/app`, `apps/web/src/modules`, `apps/web/src/shared`, `apps/web/src/test`, and `apps/web/e2e` for files that do not match their documented boundary.
- [x] 1.3 Inventory route composition in `apps/web/src/app/router.tsx`, including public routes, protected app routes, admin routes, fallback routes, and redirects.
- [x] 1.4 Search runtime code for imports from `tmp`, `tmp/web`, legacy `@/components/ui` aliases, generated files, and private cross-module folders.
- [x] 1.5 Inventory generated `@licitadoc/api-client` imports and classify whether each belongs in app infrastructure, a module `api` adapter, or module model/type mapping.

## 2. Source Boundary Alignment

- [x] 2.1 Move or adjust app-wide concerns so providers, query client setup, router creation, guards, theme setup, and app-level helpers live under `apps/web/src/app`.
- [x] 2.2 Move or adjust public and product workflow screens so page entrypoints, module-owned UI, API adapters, and model helpers live under the owning `apps/web/src/modules/<module>`.
- [x] 2.3 Move or adjust reusable UI primitives, generic UI hooks, layouts, and shared utilities so they live under `apps/web/src/shared`.
- [x] 2.4 Keep frontend test infrastructure under `apps/web/src/test` and browser route tests under `apps/web/e2e`.
- [x] 2.5 Remove runtime dependency on temporary migration sources and legacy aliases by replacing imports with `@/shared/ui`, `@/shared/hooks`, `@/shared/lib`, or module public APIs.

## 3. Module API and Routing Cleanup

- [x] 3.1 Review each module `index.ts` and keep only intentional page, hook, helper, or route exports needed outside the module.
- [x] 3.2 Replace direct imports from another module's private `api`, `model`, `ui`, or `pages` folders with imports from that module public API or documented route export.
- [x] 3.3 Keep `apps/web/src/app/router.tsx` focused on route composition and move reusable workflow logic back into owning modules when needed.
- [x] 3.4 Verify protected route and admin route authorization logic still composes app-level guards without duplicating session checks inline across pages.
- [x] 3.5 Preserve existing route paths, redirects, and fallback behavior unless a route change is deliberate and covered by tests.

## 4. API Adapter and Mock Alignment

- [x] 4.1 Keep generated `@licitadoc/api-client` hook names, query keys, and request types isolated to app infrastructure or module `api` boundaries.
- [x] 4.2 Update product pages and module UI to consume module-level hooks, adapters, and model helpers with product-oriented names.
- [x] 4.3 Update MSW fixtures and handlers for any backend-backed route or component behavior changed during alignment.
- [x] 4.4 Confirm generated files under `packages/api-client/src/gen` were not edited manually.
- [x] 4.5 Regenerate `@licitadoc/api-client` only if backend schemas or OpenAPI output actually changed.

## 5. Test Coverage

- [x] 5.1 Add or update Vitest coverage for route guards, provider-wrapped rendering, and modules touched by the boundary alignment.
- [x] 5.2 Add or update module adapter tests where generated-client details are hidden behind module-level hooks or helpers.
- [x] 5.3 Add or update Playwright coverage for public routes, authenticated app route behavior, fallback routes, and admin route access where relevant.
- [x] 5.4 Add static-search validation notes or test assertions for absence of `tmp`, `tmp/web`, `@/components/ui`, and private cross-module imports in runtime code.
- [x] 5.5 Ensure tests use MSW or module adapter mocks instead of live backend dependencies or handwritten global fetch stubs.

## 6. Validation

- [x] 6.1 Run `pnpm --filter @licitadoc/web typecheck` and fix TypeScript issues.
- [x] 6.2 Run `pnpm --filter @licitadoc/web lint` and fix lint/format issues.
- [x] 6.3 Run `pnpm --filter @licitadoc/web test` and fix Vitest failures.
- [x] 6.4 Run `pnpm --filter @licitadoc/web test:e2e` and fix Playwright failures.
- [x] 6.5 Re-run the architecture import searches and document any intentional exceptions in the final implementation summary.
