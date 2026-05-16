## 1. Feature Structure

- [x] 1.1 Review the v0 demo reference and translate only the relevant interaction patterns into the existing Vite React app conventions.
- [x] 1.2 Create a new `apps/web/src/modules/help` module with a public export for the contextual help widget.
- [x] 1.3 Add route-context model helpers that map authenticated route groups to help titles, suggestions, and quick actions.
- [x] 1.4 Add deterministic local response helpers for typed messages and quick-action selections.

## 2. Widget UI

- [x] 2.1 Implement the collapsed floating trigger with help/chat iconography, availability indicator, accessible label, and visible focus state.
- [x] 2.2 Implement the expanded widget panel with header identity, status text, close/minimize controls, conversation history, contextual suggestions, quick actions, and message input.
- [x] 2.3 Implement local open, close, minimized, typing, message submission, and quick-action interaction states.
- [x] 2.4 Apply existing design-system primitives, Tailwind tokens, spacing, contrast, and restrained visual styling so the widget feels trustworthy and production-ready.
- [x] 2.5 Add responsive behavior so the widget remains readable and non-overlapping on desktop and mobile viewports.

## 3. App Shell Integration

- [x] 3.1 Render the help widget from the authenticated app-shell layout.
- [x] 3.2 Ensure the widget is not rendered by default on public, sign-in, recovery, or onboarding-only routes outside the authenticated app shell.
- [x] 3.3 Keep the initial implementation frontend-local with no backend API, database, generated API client, or persistence changes.

## 4. Tests

- [x] 4.1 Add unit tests for route-context mapping, fallback suggestions, and deterministic response helpers.
- [x] 4.2 Add component tests for collapsed trigger rendering, opening the panel, closing/minimizing, sending a message, selecting quick actions, and accessible labels.
- [x] 4.3 Add app-shell coverage proving the widget appears on authenticated shell pages and remains absent from non-app-shell routes.
- [x] 4.4 Add targeted browser or visual smoke coverage for desktop and mobile placement if the affected routes are available through Playwright.

## 5. Validation

- [x] 5.1 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.2 Run `pnpm --filter @licitadoc/web lint` (full lint reports pre-existing diagnostics outside this change; changed files pass Biome).
- [x] 5.3 Run `pnpm --filter @licitadoc/web test`.
- [x] 5.4 Run `pnpm --filter @licitadoc/web test:e2e` or document why browser validation could not be completed.
