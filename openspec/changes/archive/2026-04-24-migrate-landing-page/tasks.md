## 1. Inventory and Route Plan

- [x] 1.1 Review `tmp/landing.tsx` for imported packages, UI primitives, route links, anchors, icons, and visual sections.
- [x] 1.2 Decide the final route mapping for the landing page and the existing API/session smoke page.
- [x] 1.3 Confirm all landing page runtime dependencies are already declared by `@licitadoc/web`.

## 2. Module Migration

- [x] 2.1 Create a public-facing module under `apps/web/src/modules` for the landing page.
- [x] 2.2 Move the landing page implementation from `tmp/landing.tsx` into the module page entrypoint.
- [x] 2.3 Rewrite imports to use `react-router-dom`, `@/shared/ui`, and existing shared design-system boundaries.
- [x] 2.4 Replace temporary or legacy aliases so no runtime code imports from `tmp` or `@/components/ui`.
- [x] 2.5 Export the landing page from the module public API.

## 3. Router Composition

- [x] 3.1 Update `apps/web/src/app/router.tsx` to compose the landing page route through the existing app route tree.
- [x] 3.2 Preserve the existing home/API/session smoke page under a stable route if `/` becomes the public landing page.
- [x] 3.3 Verify the landing page internal links and same-page anchors are compatible with React Router and browser fragment navigation.

## 4. Styling and Accessibility Pass

- [x] 4.1 Ensure the migrated page uses existing design-system tokens from `apps/web/src/styles.css`.
- [x] 4.2 Adjust markup only as needed for Vite, React, accessibility, and responsive stability.
- [x] 4.3 Run Biome formatting on the migrated page and touched route/module files.

## 5. Test Coverage

- [x] 5.1 Add or update a Vitest component test for the landing page module.
- [x] 5.2 Update the existing home/status component test if the API/session smoke page route or naming changes.
- [x] 5.3 Add or update a Playwright smoke test for the public landing route.
- [x] 5.4 Keep or update Playwright coverage for the API/session smoke route if it moves away from `/`.

## 6. Validation

- [x] 6.1 Run `pnpm --filter @licitadoc/web typecheck` and fix any TypeScript issues.
- [x] 6.2 Run `pnpm --filter @licitadoc/web lint` and fix any Biome issues.
- [x] 6.3 Run `pnpm --filter @licitadoc/web test` and fix any Vitest issues.
- [x] 6.4 Run `pnpm --filter @licitadoc/web test:e2e` and fix any Playwright issues.
- [x] 6.5 Confirm no runtime code imports from `tmp/landing.tsx`, `tmp`, or legacy `@/components/ui` aliases.
