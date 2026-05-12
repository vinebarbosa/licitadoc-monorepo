## Context

The protected app shell already renders `AppHeader` from `apps/web/src/modules/app-shell/components/app-header.tsx`, but that implementation still carries the search UI and lacks the light/dark theme control present in `tmp/app-header.tsx`. The current web app has its own theme context in `apps/web/src/app/theme.tsx`, so the migrated header must use that architecture rather than the temporary component's `next-themes` dependency.

The current shell also exposes `showSearch` through route handles and `useAppShellHeader`. Since the requested header no longer includes search, those route-handle fields should be removed or ignored at the architecture boundary as part of the migration.

## Goals / Non-Goals

**Goals:**
- Keep the supported app-shell header under `apps/web/src/modules/app-shell/components`.
- Preserve sidebar trigger, breadcrumb/title rendering, and notification affordance.
- Add a light/dark toggle using the existing `useTheme` hook from `apps/web/src/app/theme.tsx`.
- Remove the search input from the header and clean up `showSearch` usage in app-shell route handles.
- Keep imports aligned with `@/shared/ui` and existing frontend module boundaries.

**Non-Goals:**
- Implement a notifications dropdown, notification data fetching, or unread-count API integration.
- Add a system theme mode or introduce `next-themes`.
- Redesign the full app shell/sidebar or migrate unrelated temporary dashboard code.

## Decisions

- Use the existing app theme context for toggling.
  - Rationale: `ThemeProvider` already owns persistence, document-root class updates, and the light/dark state.
  - Alternative considered: port the temporary dropdown that uses `next-themes`; rejected because it would add an unnecessary dependency and a second theme abstraction.

- Render a single icon button for light/dark mode.
  - Rationale: the user asked for a toggle between light and dark, and the app's theme model only supports those two values.
  - Alternative considered: a dropdown with Claro, Escuro, and Sistema; rejected because system mode is not part of the current app theme contract.

- Remove header search props from the app shell instead of hiding the search input conditionally.
  - Rationale: a permanent "no search" header is simpler and avoids route handles carrying stale UI flags.
  - Alternative considered: keep `showSearch` defaulting to false; rejected because it preserves an unused header responsibility.

- Keep notification behavior presentation-only for now.
  - Rationale: the temporary header only provides a button and badge, and there is no backend notification contract in this change.
  - Alternative considered: add a notification menu or API integration; rejected as out of scope.

## Risks / Trade-offs

- Existing routes that set `showSearch: false` must be updated while preserving their breadcrumb/title metadata. → Remove only the search-specific handle fields and keep the rest intact.
- The notification badge may remain static until a real notifications feature exists. → Keep it presentation-only and accessible, matching the temporary component's current behavior.
- Theme toggle tests may need to render through providers. → Add or adjust focused web tests using the existing `renderWithProviders` helper.
