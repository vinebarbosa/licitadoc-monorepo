## 1. Reconcile Session After Sign-In

- [x] 1.1 Update the web auth module or sign-in page so successful sign-in updates, invalidates, or refetches the generated `get-session` query used by `useAuthSession`.
- [x] 1.2 Keep existing safe redirect target handling for encoded internal paths such as `redirectTo=%2Fapp`.

## 2. Prevent Protected Redirect Bounce

- [x] 2.1 Ensure navigation to `/app` after sign-in observes authenticated session state instead of cached anonymous state.
- [x] 2.2 Preserve existing invalid-credential error behavior without navigating or mutating session cache.

## 3. Validate The Redirect Flow

- [x] 3.1 Add focused Vitest coverage for the full `/app` -> `/entrar?redirectTo=%2Fapp` -> sign-in -> `/app` flow.
- [x] 3.2 Add or update focused coverage proving unsafe redirect fallback and invalid login behavior still work.
- [x] 3.3 Run `pnpm --filter @licitadoc/web typecheck`, focused frontend lint on touched files, and the relevant web tests.
