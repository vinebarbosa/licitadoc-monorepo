## Why

The repository has a complete public landing page in `tmp/landing.tsx`, but it still sits outside the Vite app and uses legacy design-system aliases. Migrating it now makes the new modular frontend architecture useful for the first real public screen while reusing the shared design-system foundation.

## What Changes

- Move the landing page into `apps/web` as a module-owned public route entrypoint.
- Rewrite imports from temporary or legacy aliases to `@/shared/ui` and `react-router-dom`.
- Compose the landing page through the centralized app router without bypassing `AppLayout` or app providers.
- Preserve the current home/API smoke route behavior until a deliberate route replacement is made.
- Add focused Vitest and Playwright coverage for the migrated landing page route.
- Keep `tmp/landing.tsx` as source input only; runtime code must not import from `tmp`.

## Capabilities

### New Capabilities

- `web-public-landing-page`: Public marketing landing page behavior, routing, modular ownership, and validation expectations.

### Modified Capabilities

- `web-frontend-architecture`: Clarifies how public marketing pages fit into the modular frontend route/module structure.

## Impact

- Affected app code: `apps/web/src/app/router.tsx`, new or updated files under `apps/web/src/modules`.
- Affected shared code: reused `apps/web/src/shared/ui` design-system primitives and existing Tailwind tokens in `apps/web/src/styles.css`.
- Affected tests: Vitest component tests and Playwright route smoke tests for the landing page.
- No backend API contract changes are expected.
- No new runtime dependencies are expected beyond packages already declared by the migrated design system, including `lucide-react`.
