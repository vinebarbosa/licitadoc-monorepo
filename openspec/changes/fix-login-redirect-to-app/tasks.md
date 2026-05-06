## 1. Update Redirect Selection

- [x] 1.1 Update the auth redirect helper so missing, external, or protocol-relative redirect targets fall back to `/app`.
- [x] 1.2 Keep valid same-origin app paths, including paths with query strings, as accepted redirect targets.

## 2. Preserve Protected Route Intent

- [x] 2.1 Update the session-aware route guard to include the current pathname and search string as an encoded `redirectTo` parameter when redirecting unauthenticated visitors to `/entrar`.
- [x] 2.2 Ensure unauthorized authenticated visitors still redirect to `/nao-autorizado` without changing that behavior.

## 3. Validate Auth Routing Behavior

- [x] 3.1 Add or update focused Vitest coverage for direct successful sign-in navigating to `/app` by default.
- [x] 3.2 Add or update focused Vitest coverage for safe redirect targets, unsafe redirect fallback, and protected-route redirect preservation.
- [x] 3.3 Run `pnpm --filter @licitadoc/web typecheck`, focused frontend lint on touched files, and the relevant web tests.
