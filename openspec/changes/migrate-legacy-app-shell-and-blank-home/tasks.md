## 1. Migrate The Legacy App Shell

- [x] 1.1 Create the runtime app shell structure in `apps/web` by migrating the legacy layout, header, and sidebar from `tmp` into the current app/shared boundaries.
- [x] 1.2 Replace legacy router and UI aliases from the migrated shell with `react-router-dom` and `@/shared/ui` imports supported by the current frontend.
- [x] 1.3 Add a blank home route entrypoint for the internal app shell without seeded dashboard content.

## 2. Compose Routes And Access Behavior

- [x] 2.1 Update the centralized router to keep `/` on the public landing page and add a protected `/app` route tree for the migrated shell.
- [x] 2.2 Reuse the existing session-aware guard behavior so unauthenticated visitors are redirected away from `/app`.
- [x] 2.3 Remove the theme switch from the landing page header while preserving its navigation and CTA links.

## 3. Validate The New Shell And Landing Behavior

- [x] 3.1 Add or update focused Vitest coverage for the simplified landing page header behavior.
- [x] 3.2 Add focused Vitest coverage for the `/app` shell route, including protected access and blank home rendering.
- [x] 3.3 Run `pnpm --filter @licitadoc/web typecheck`, focused frontend lint on touched files, and the relevant web tests.
