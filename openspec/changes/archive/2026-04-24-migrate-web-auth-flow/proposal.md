## Why

The web app already links visitors to `/entrar`, `/cadastro`, and `/recuperar-senha`, but those routes are not part of the current modular frontend and the old auth screens still live only in `tmp`. Migrating the legacy auth pages into the new architecture and adding explicit unauthorized and not-found states is necessary to make authentication navigable, testable, and consistent with the app router.

## What Changes

- Migrate the legacy authentication pages from `tmp` into a dedicated frontend auth module under `apps/web/src/modules`.
- Implement the frontend authentication flow around the existing backend contracts for sign-in, session retrieval, password reset, and session-aware route protection.
- Preserve and migrate the public request-access page UX from the legacy `/cadastro` screen while keeping its behavior aligned with available backend contracts.
- Add dedicated `não autorizado` and `não encontrado` pages and wire them into centralized routing and guard behavior.
- Add focused frontend coverage for auth routes, fallback pages, and route-guard outcomes.

## Capabilities

### New Capabilities
- `web-authentication-flow`: Modular authentication pages, session-aware routing, and frontend auth actions built on the existing generated API client and current backend auth/invite contracts.
- `web-route-fallback-pages`: Dedicated unauthorized and not-found pages integrated into the centralized web router.

### Modified Capabilities

## Impact

- Affected package: `apps/web`
- Likely touched areas: `src/app`, a new `src/modules/auth`, router composition, route guards, shared test helpers, and route-level tests
- Primary integration boundary remains `@licitadoc/api-client`; no manual edits to generated client files are expected
- Existing `tmp/entrar.tsx`, `tmp/cadastro.tsx`, and `tmp/recuperar-senha.tsx` become migration sources rather than runtime code