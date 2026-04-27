## 1. Wire Logout Contract

- [x] 1.1 Add a web auth module wrapper for the generated `useSignOut` mutation.
- [x] 1.2 Ensure successful sign-out invalidates or clears the frontend session query state used by `useAuthSession`.

## 2. Connect App Shell UI

- [x] 2.1 Replace the app shell `Sair` link with a logout action that calls sign-out.
- [x] 2.2 Navigate to `/entrar` after successful logout and disable duplicate logout submissions while pending.

## 3. Validate Logout Behavior

- [x] 3.1 Add focused Vitest/MSW coverage proving the app shell logout action calls `/api/auth/sign-out` and navigates to `/entrar`.
- [x] 3.2 Add focused coverage that protected `/app` access is unauthenticated after logout/session invalidation.
- [x] 3.3 Run `pnpm --filter @licitadoc/web typecheck`, focused frontend lint on touched files, and the relevant web tests.
