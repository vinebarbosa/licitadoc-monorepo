# Web Architecture

This document describes the intended architecture for `apps/web`. The package is a Vite React app that uses React Router, TanStack Query, Tailwind CSS, and the generated `@licitadoc/api-client` package.

## Package Role

`apps/web` owns browser-facing product workflows. It consumes backend contracts through `@licitadoc/api-client`, whose generated code comes from the OpenAPI document produced by `apps/api`.

The frontend follows a modular architecture. Backend modules are important contract inputs, but frontend modules are product and UI workflow boundaries. A frontend module can map closely to a backend module, or it can compose multiple backend contracts when the user workflow needs that.

## Source Layout

The primary source boundaries are:

- `src/app`: app-wide composition such as providers, query client setup, router creation, route guards, environment helpers, and app-level error boundaries.
- `src/modules`: product workflow modules. Modules own their screens, module-specific UI, data adapters, model helpers, and route entrypoints.
- `src/shared`: reusable UI, design-system primitives, shared hooks, layout, formatting, browser, and utility code that does not depend on a specific product workflow.
- `src/test`: Vitest setup, Testing Library render helpers, MSW handlers, mock fixtures, and shared test utilities.
- `e2e`: Playwright browser tests.

Use `src/modules` as the default home for product code. Use `src/shared` only when code is genuinely reusable across modules and does not carry module-specific rules.

## Design System

The design system lives under `src/shared`:

- `src/shared/ui`: reusable primitives such as buttons, dialogs, forms, tables, sidebars, toasts, cards, inputs, menus, and related composition pieces.
- `src/shared/hooks`: generic UI hooks such as mobile viewport detection and toast state.
- `src/shared/lib`: shared UI utilities such as `cn`.

Design-system components should import other primitives from `@/shared/ui`, shared hooks from `@/shared/hooks`, and utilities from `@/shared/lib`. Do not import runtime code from `tmp/web`; that folder is only a source bundle used during migration.

`src/styles.css` owns the design-system CSS variables, dark-mode variables, status colors, radius tokens, Tailwind theme mappings, and base layer rules. Keep new product styling aligned with those tokens.

## Module Shape

A module may contain these folders when they are useful:

- `api`: generated-client adapters, query options, mutation helpers, and invalidation rules.
- `model`: module-specific types, constants, mappers, and derived state.
- `ui`: reusable UI components that belong to the module.
- `pages`: route entrypoints owned by the module.
- `routes.tsx`: optional route definitions or route entry exports for app router composition.
- `index.ts`: the module public API.

Code outside a module should import from the module public API or a documented route export. Avoid importing from another module's internal `api`, `model`, `ui`, or `pages` folders.

## App Composition

`src/main.tsx` should stay small: find the root element and render the app composition.

`src/app` owns process-wide concerns:

- `app.tsx`: top-level app component.
- `providers.tsx`: React providers such as TanStack Query.
- `query-client.ts`: query client defaults.
- `router.tsx`: final route tree composition.
- `route-guards.tsx`: app-level route guards when workflows require them.

Route modules should bind URL structure to layouts and module pages. They should not become the place where reusable module logic lives.

## API Boundary

The generated `@licitadoc/api-client` package is the HTTP contract boundary. Do not edit generated files under `packages/api-client/src/gen`.

When backend contracts change:

1. update backend route schemas in `apps/api`,
2. regenerate OpenAPI output,
3. run `pnpm --filter @licitadoc/api-client generate`,
4. update frontend module adapters and mocks.

Generated hooks may be imported in module `api` folders, app infrastructure, or temporary smoke code. Product pages and components should normally consume module-level hooks that use product names and centralize loading, error, and invalidation behavior.

## Testing Strategy

Use Vitest for fast unit and component tests. Component tests should render through shared test helpers that provide the same app-level providers used in production.

Use Mock Service Worker for HTTP behavior in Vitest tests. Handlers live in `src/test/msw` and should be organized so module-specific handlers can be added near the relevant workflow.

Use Playwright for browser-level route smoke tests and future end-to-end workflows. Browser tests may use deterministic route mocks for backend responses and should not require a developer to manually start the browser.

## Validation Commands

From the repository root:

- `pnpm --filter @licitadoc/web typecheck`
- `pnpm --filter @licitadoc/web lint`
- `pnpm --filter @licitadoc/web test`
- `pnpm --filter @licitadoc/web test:e2e`

Run the generated client command when backend contracts changed:

- `pnpm --filter @licitadoc/api-client generate`

## Extension Rules

- Add app-wide concerns under `src/app`.
- Add product workflows under `src/modules/<module>`.
- Keep module internals private unless exported from `index.ts` or a documented route export.
- Add reusable primitives under `src/shared` only when they are independent of module rules.
- Add design-system primitives under `src/shared/ui`, generic UI hooks under `src/shared/hooks`, and shared UI helpers under `src/shared/lib`.
- Mock backend HTTP behavior with MSW in component tests.
- Keep Playwright tests small and workflow-focused.
