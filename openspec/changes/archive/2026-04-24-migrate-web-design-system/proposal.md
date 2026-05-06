## Why

`tmp/web` now contains the frontend design-system source that should become the reusable UI foundation for `apps/web`. Migrating these components, hooks, and styles into the modular frontend will let product modules build screens with consistent tokens, primitives, accessibility behavior, and interaction patterns instead of continuing with ad hoc page styling.

## What Changes

- Move the design-system components from `tmp/web/components/ui` into the frontend shared UI boundary.
- Move design-system hooks from `tmp/web/components/ui` into an appropriate shared hook or shared UI location.
- Merge the design-system global styles and tokens from `tmp/web/globals.css` into `apps/web/src/styles.css` without losing the current Vite/Tailwind setup.
- Update `apps/web/components.json` aliases so future shadcn-style additions target the modular frontend layout.
- Add the runtime dependencies required by the migrated components, including Radix primitives, `class-variance-authority`, `lucide-react`, `react-hook-form`, `sonner`, `vaul`, `cmdk`, `recharts`, `react-day-picker`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `next-themes`, and `tw-animate-css` as needed.
- Add or adjust shared utilities such as `cn` so migrated components compile without depending on temporary paths.
- Update frontend architecture/agent documentation to describe where design-system primitives, hooks, and style tokens live.
- Add smoke coverage that imports/renders representative migrated primitives and keeps the existing app route working.

## Capabilities

### New Capabilities
- `web-design-system-foundation`: Defines how `apps/web` exposes migrated design-system primitives, hooks, tokens, and styles as the shared UI foundation for product modules.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/shared/**`, `apps/web/src/styles.css`, `apps/web/components.json`, frontend tests, and package metadata.
- Affected packages: `@licitadoc/web`.
- Dependencies: likely adds several UI/runtime packages used by the design-system components listed in `tmp/web`.
- Source inputs: `tmp/web/components.json`, `tmp/web/components/ui/**`, `tmp/web/globals.css`, and `tmp/web/index.html`.
- Backend/API: no backend behavior or HTTP contract changes are intended.
