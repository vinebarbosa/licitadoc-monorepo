# Web Agent Guide

This guide is for contributors and coding agents working in `apps/web`.

## Package

`apps/web` is the browser app. It uses Vite, React, React Router, TanStack Query, Tailwind CSS, Vitest, Playwright, and Mock Service Worker. Backend HTTP contracts come from `@licitadoc/api-client`.

## Commands

Run these from the repository root:

- `pnpm --filter @licitadoc/web dev`
- `pnpm --filter @licitadoc/web typecheck`
- `pnpm --filter @licitadoc/web lint`
- `pnpm --filter @licitadoc/web test`
- `pnpm --filter @licitadoc/web test:e2e`
- `pnpm --filter @licitadoc/api-client generate`

Use the generated client command only after backend schema/OpenAPI changes.

## Where To Work

- App providers, query client defaults, router composition, guards, and environment helpers belong in `src/app`.
- Product workflows belong in `src/modules/<module>`.
- Module-specific generated-client adapters belong in `src/modules/<module>/api`.
- Module route entrypoints belong in `src/modules/<module>/pages` or documented module route exports.
- Reusable UI primitives belong in `src/shared/ui`.
- Generic design-system hooks belong in `src/shared/hooks`.
- Shared UI helpers such as `cn` belong in `src/shared/lib`.
- Other reusable UI and utilities belong in `src/shared` only when independent of a product module.
- Vitest setup, render helpers, fixtures, and MSW handlers belong in `src/test`.
- Browser tests belong in `e2e`.

## Boundaries

Do not edit generated files under `packages/api-client/src/gen`.

Do not import from another module's private folders unless that module explicitly exports the API you need. Prefer imports from `src/modules/<module>/index.ts` or a documented route export.

Avoid handwritten `fetch` calls in product code. Use `@licitadoc/api-client` through app infrastructure or module-level adapters.

Do not import runtime code from `tmp/web`. Files copied from that source bundle must use `@/shared/ui`, `@/shared/hooks`, and `@/shared/lib` imports after migration.

## Workflow

1. Read `apps/web/architecture.md` before making structural changes.
2. Keep changes scoped to the smallest module or app boundary that fits.
3. Update MSW handlers when UI behavior depends on backend responses.
4. Add Vitest coverage for module utilities, adapters, component behavior, and representative shared UI primitives.
5. Add Playwright coverage for browser route behavior when a workflow becomes navigable.
6. Run typecheck, lint, Vitest, and Playwright before considering the task complete.

## Current Smoke Surface

The current app route renders the `home` module and checks API health plus auth session state through generated-client backed module adapters. Treat this as a smoke screen, not as the final product dashboard.
