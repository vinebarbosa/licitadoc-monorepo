## 1. Header Migration

- [x] 1.1 Update `apps/web/src/modules/app-shell/components/app-header.tsx` to remove search UI/imports and render notification plus light/dark theme toggle.
- [x] 1.2 Wire the theme toggle to `useTheme().toggleTheme` from `apps/web/src/app/theme.tsx` and use the current theme state for the sun/moon affordance.
- [x] 1.3 Keep breadcrumb and title rendering behavior intact while ensuring the component imports only from supported `apps/web` architecture paths.

## 2. Shell Metadata Cleanup

- [x] 2.1 Remove `showSearch` from app-shell header types, props, defaults, and route matching logic.
- [x] 2.2 Remove obsolete `showSearch` route-handle values from protected routes and page-level header overrides.

## 3. Verification

- [x] 3.1 Add or update focused web tests covering no search textbox, notification action visibility, and theme toggle behavior.
- [x] 3.2 Run the relevant web validation command for the changed files and fix any type, lint, or test failures.
