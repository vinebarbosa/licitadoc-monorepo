## 1. Inventory

- [x] 1.1 Review `tmp/web/components.json`, `tmp/web/globals.css`, and `tmp/web/components/ui/**` to confirm the source files and imported packages.
- [x] 1.2 Identify every runtime dependency imported by migrated design-system files and compare it with `apps/web/package.json`.
- [x] 1.3 Identify temporary aliases and Next-specific assumptions that must be adapted for the Vite modular frontend.

## 2. Shared UI Migration

- [x] 2.1 Create `apps/web/src/shared/ui`, `apps/web/src/shared/hooks`, and `apps/web/src/shared/lib` as needed for the design-system boundary.
- [x] 2.2 Add the shared `cn` utility under `src/shared/lib`.
- [x] 2.3 Copy design-system primitives from `tmp/web/components/ui` into `src/shared/ui`.
- [x] 2.4 Move generic hooks such as `use-mobile` and `use-toast` into `src/shared/hooks` or another documented shared boundary.
- [x] 2.5 Rewrite imports from `@/components/ui`, `@/hooks`, and `@/lib/utils` to the shared modular paths.
- [x] 2.6 Adapt or remove any Next-only assumptions that are incompatible with Vite React.

## 3. Styles and Configuration

- [x] 3.1 Merge design-system tokens and base rules from `tmp/web/globals.css` into `apps/web/src/styles.css`.
- [x] 3.2 Preserve app root sizing and Vite/Tailwind imports while adopting the design-system background, foreground, radius, status, sidebar, chart, and dark-mode tokens.
- [x] 3.3 Update `apps/web/components.json` so future component additions target `src/shared/ui`, `src/shared/hooks`, and `src/shared/lib`.
- [x] 3.4 Update `apps/web/architecture.md` and `apps/web/agents.md` with the design-system shared boundary and validation expectations.

## 4. Dependencies and Providers

- [x] 4.1 Add all required design-system runtime dependencies to `@licitadoc/web`.
- [x] 4.2 Update the lockfile by installing dependencies.
- [x] 4.3 Add any app-level providers needed for migrated primitives, such as tooltip, theme, or toaster support, without disrupting existing providers.

## 5. Test Coverage

- [x] 5.1 Add a Vitest smoke test that imports and renders representative shared UI primitives.
- [x] 5.2 Keep or update the existing home route component test so it passes with the migrated styles/providers.
- [x] 5.3 Keep or update the Playwright home route smoke test so it passes with the migrated styles/providers.

## 6. Validation

- [x] 6.1 Run `pnpm --filter @licitadoc/web typecheck` and fix any TypeScript issues.
- [x] 6.2 Run `pnpm --filter @licitadoc/web lint` and fix any Biome issues.
- [x] 6.3 Run `pnpm --filter @licitadoc/web test` and fix any Vitest issues.
- [x] 6.4 Run `pnpm --filter @licitadoc/web test:e2e` and fix any Playwright issues.
- [x] 6.5 Confirm no runtime code imports from `tmp/web`.
