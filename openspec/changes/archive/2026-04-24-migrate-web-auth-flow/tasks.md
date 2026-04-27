## 1. Auth Module Migration

- [x] 1.1 Create a dedicated `auth` frontend module and migrate the legacy `/entrar`, `/cadastro`, and `/recuperar-senha` pages from `tmp` into module-owned route entrypoints using the current shared UI boundaries.
- [x] 1.2 Add module-level auth adapters over `@licitadoc/api-client` for session lookup, sign-in, password reset, and normalized session/role access decisions.
- [x] 1.3 Implement the migrated auth page behavior so sign-in and password reset use real backend contracts while `/cadastro` preserves the public request-access acknowledgment flow.

## 2. Routing And Access States

- [x] 2.1 Update the centralized app router to expose `/entrar`, `/cadastro`, `/recuperar-senha`, `/nao-autorizado`, and a wildcard not-found route.
- [x] 2.2 Replace the current boolean-only guard behavior with session-aware redirects that distinguish unauthenticated visitors from authenticated-but-unauthorized visitors.
- [x] 2.3 Add dedicated unauthorized and not-found page components in module-owned code and wire their recovery navigation back into known routes.

## 3. Coverage And Validation

- [x] 3.1 Add Vitest coverage for migrated auth routes, auth form outcomes, session-aware redirects, and fallback page rendering.
- [x] 3.2 Add browser-level smoke coverage for the new public auth and fallback routes when the route tree is navigable enough for Playwright.
- [x] 3.3 Run `pnpm --filter @licitadoc/web typecheck`, `pnpm --filter @licitadoc/web lint`, `pnpm --filter @licitadoc/web test`, and `pnpm --filter @licitadoc/web test:e2e`.