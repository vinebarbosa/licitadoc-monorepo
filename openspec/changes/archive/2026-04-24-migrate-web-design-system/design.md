## Context

`apps/web` now has a modular frontend architecture with app composition in `src/app`, product modules in `src/modules`, reusable code in `src/shared`, and test helpers in `src/test`. The current UI surface is still a simple smoke page with local styling.

The user added a prepared design-system source tree under `tmp/web`. It contains shadcn-style components in `tmp/web/components/ui`, hooks such as `use-mobile` and `use-toast`, `components.json`, `globals.css`, and an `index.html`. The component imports assume a `@/components`, `@/hooks`, and `@/lib/utils` layout, while `apps/web` now uses the modular layout and currently has no shared UI library or `cn` utility.

The migration should treat `tmp/web` as the source input for a real `apps/web` design-system foundation. It should not turn `tmp/web` itself into runtime source.

## Goals / Non-Goals

**Goals:**
- Move the design-system primitives, hooks, and style tokens from `tmp/web` into `apps/web`.
- Place migrated UI primitives under the shared boundary so product modules can consume them without owning design-system internals.
- Adapt imports and shadcn aliases to the current Vite/modular architecture.
- Preserve the legal/compliance-oriented token palette from `tmp/web/globals.css`.
- Add the package dependencies required by the migrated components.
- Add a `cn` utility and any small compatibility helpers needed by the component set.
- Keep the existing app route functional after the style migration.
- Add smoke tests that prove representative primitives can render and the existing route still works.
- Update `apps/web/architecture.md` and `apps/web/agents.md` with the new design-system boundary.

**Non-Goals:**
- Redesigning every screen or building final product workflows.
- Editing generated API client code.
- Keeping `tmp/web` as an imported source folder.
- Migrating Next.js-specific runtime assumptions directly into Vite without adaptation.
- Adding Storybook or a full visual regression pipeline in this change.

## Decisions

### Decision: Move primitives to `src/shared/ui`

The migrated components should live in `apps/web/src/shared/ui`. This matches the existing architecture rule that reusable UI belongs in `src/shared`, keeps product modules clean, and creates one public surface for design-system primitives.

Alternatives considered:
- Put components under `src/components/ui` to match the temporary shadcn aliases. Rejected because it weakens the modular architecture and creates a second top-level convention.
- Put components inside a product module. Rejected because the design system is shared infrastructure.

### Decision: Move design-system hooks to `src/shared/hooks`

Hooks from `tmp/web` that are not specific to one product workflow should live under `src/shared/hooks`. Components may import shared hooks directly or through aliases configured in `components.json`.

Alternatives considered:
- Keep hooks next to components in `src/shared/ui`. Rejected for generic hooks such as `useIsMobile` because they are reusable outside the UI primitive folder.
- Create `src/hooks`. Rejected because `src/shared/hooks` is clearer inside the current architecture.

### Decision: Keep aliases compatible with the modular layout

`apps/web/components.json` should target the new shared paths. Component imports should be adapted from temporary aliases:

- `@/components/ui/*` -> `@/shared/ui/*`
- `@/hooks/*` -> `@/shared/hooks/*`
- `@/lib/utils` -> `@/shared/lib/utils`

The implementation may either rewrite imports during migration or configure aliases that resolve to the shared locations. Rewriting imports is preferred because it makes ownership explicit in source files.

Alternatives considered:
- Preserve temporary aliases exactly. Rejected because it hides the actual architecture boundary and makes future code generation ambiguous.

### Decision: Merge global styles carefully

`tmp/web/globals.css` should be merged into `apps/web/src/styles.css` while preserving Vite/Tailwind import behavior and app root sizing. The resulting stylesheet should expose the design-system CSS variables, dark-mode variables, Tailwind theme tokens, status colors, and base layer rules.

The current decorative smoke-page background can be replaced or simplified if it conflicts with design-system tokens.

Alternatives considered:
- Import both stylesheets. Rejected because it increases ordering ambiguity and leaves temporary naming in runtime code.
- Copy only component classes and ignore tokens. Rejected because the components rely on CSS variables and the product needs consistent visual semantics.

### Decision: Add dependencies explicitly to `@licitadoc/web`

The migrated source imports several runtime packages that should become direct dependencies of `@licitadoc/web`, including Radix primitives, `class-variance-authority`, `lucide-react`, `react-hook-form`, `sonner`, `vaul`, `cmdk`, `recharts`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `next-themes`, and `tw-animate-css` as needed.

Alternatives considered:
- Add dependencies only when each component is first used. Rejected because the migrated component library should compile immediately.
- Keep unused components out of the migration. Rejected because the user provided the design-system component set as the intended migration input.

### Decision: Adapt Next-specific assumptions for Vite

`tmp/web/components.json` has `rsc: true` and some source assumes Next-style conventions. `apps/web` is Vite React, so the migrated configuration should keep `rsc: false`, avoid Next-only APIs, and provide Vite-compatible theme/toaster/provider usage.

Alternatives considered:
- Preserve `rsc: true`. Rejected because React Server Components are not part of the current Vite app architecture.

### Decision: Validate with compile and smoke rendering

This change should run the normal frontend validation commands and add a small smoke test that imports and renders representative primitives such as button, card, input, dialog, and toast/toaster or tooltip provider pieces. The existing home route smoke tests should continue to pass.

Alternatives considered:
- Rely on TypeScript only. Rejected because a rendered smoke test catches provider and DOM assumptions that TypeScript can miss.

## Risks / Trade-offs

- [Component imports may assume temporary aliases] -> Rewrite imports to the shared layout and update `components.json`.
- [Dependency set may be large] -> Add only packages actually imported by migrated files and let package lock show the explicit runtime cost.
- [Next-specific code may not run in Vite] -> Adapt or defer only the incompatible part while keeping the primitive API stable.
- [Global style merge may alter the smoke page appearance] -> Prefer design-system tokens and update tests to assert behavior rather than old decorative styling.
- [Large component migration can hide type errors] -> Run typecheck, lint, Vitest, and Playwright after migration.

## Migration Plan

1. Copy `tmp/web/components/ui` into `apps/web/src/shared/ui`.
2. Move generic hooks to `apps/web/src/shared/hooks` and update imports.
3. Add `apps/web/src/shared/lib/utils.ts` with the `cn` helper.
4. Rewrite component imports from temporary aliases to `@/shared/*`.
5. Merge `tmp/web/globals.css` into `apps/web/src/styles.css`.
6. Update `apps/web/components.json` for the shared UI/hook/lib paths and Vite settings.
7. Add required dependencies to `apps/web/package.json` and update the lockfile.
8. Add app providers needed by migrated components, such as tooltip/toaster/theme providers, only when required for runtime correctness.
9. Add smoke tests for representative design-system primitives and keep existing home route tests passing.
10. Run `pnpm --filter @licitadoc/web typecheck`, `lint`, `test`, and `test:e2e`.

Rollback is straightforward: revert the migrated shared files, dependency changes, styles, and docs updates.

## Open Questions

No open questions. Treat `tmp/web` as the source import bundle and migrate it into the modular `apps/web` shared boundary.
