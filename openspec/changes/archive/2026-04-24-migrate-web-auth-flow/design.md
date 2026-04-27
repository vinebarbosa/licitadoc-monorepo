## Context

`apps/web` currently exposes only the public landing route from the centralized router, while the legacy auth pages still exist only under `tmp/entrar.tsx`, `tmp/cadastro.tsx`, and `tmp/recuperar-senha.tsx`. Those legacy files use old import aliases and are not part of the modular frontend source tree, so the current app links to auth URLs that do not resolve through the production router.

The backend already exposes Better Auth endpoints through the Fastify app and OpenAPI output, and the generated `@licitadoc/api-client` package already includes auth and invite endpoints such as session lookup, sign-in, password reset, and invite preview/acceptance. At the same time, the existing `/cadastro` page represents a public request-access experience, not a proven backend contract for public self-service provisioning.

The change is cross-cutting inside `apps/web`: it touches router composition, route guards, module boundaries, public pages, session handling, and test coverage.

## Goals / Non-Goals

**Goals:**
- Migrate the legacy auth pages from `tmp` into module-owned frontend code.
- Implement a real browser auth flow for sign-in, session restoration, and password reset using the existing generated API client boundary.
- Add explicit unauthorized and not-found experiences wired into centralized routing.
- Keep route access decisions centralized instead of duplicating session logic inside page components.
- Add focused frontend tests for migrated auth routes and fallback pages.

**Non-Goals:**
- Introduce a new backend endpoint for public access requests.
- Replace the current invite model with unrestricted public self-sign-up.
- Build the full authenticated application shell or product dashboard in the same change.
- Introduce a second browser auth integration path alongside `@licitadoc/api-client`.

## Decisions

### Decision: Use module-level auth adapters over generated auth endpoints
The migrated auth flow should use `@licitadoc/api-client` through a frontend auth module rather than depending on a direct Better Auth browser client. This keeps the web package aligned with the documented API boundary and lets route guards, pages, and tests share one contract surface.

Alternatives considered:
- Use the Better Auth browser client directly inside the auth pages.
  Rejected because it introduces a second frontend integration boundary and bypasses the project rule that product code should use module-level adapters over the generated client.
- Call generated auth endpoints directly from page components.
  Rejected because it would leak raw endpoint naming into route components and make session/error handling harder to centralize.

### Decision: Split responsibilities between an auth module and app-level routing
The migrated screens should live in a dedicated auth module, while the centralized app router and app-level guards own route composition, redirects, and fallback behavior. The unauthorized page should have an explicit route, and the not-found page should be rendered by the wildcard route.

Alternatives considered:
- Keep all auth routing logic inside page components.
  Rejected because redirect and authorization behavior would be duplicated and harder to reason about.
- Put fallback pages inside shared UI or app composition folders.
  Rejected because they are route entrypoints with page-level behavior, not reusable primitives.

### Decision: Scope real backend integration to existing contracts only
The implemented auth flow should wire real backend behavior for sign-in, session retrieval, and password reset, because those contracts already exist. The migrated `/cadastro` page should preserve the public request-access experience and deterministic confirmation state without inventing a new backend contract in this change.

Alternatives considered:
- Convert `/cadastro` into direct public account creation through Better Auth sign-up.
  Rejected because the product messaging and existing invite model are access-controlled, and open sign-up would bypass current role and organization provisioning rules.
- Remove `/cadastro` from the router until a backend exists.
  Rejected because the public landing page already routes visitors there and the user explicitly asked for the legacy page migration.

### Decision: Model authorization outcomes from session state and role data inside the auth module
The auth module should expose a normalized session view that route guards can use for authentication and authorization decisions, including role-aware redirects to the unauthorized page when a signed-in user lacks access.

Alternatives considered:
- Make every protected route interpret raw session payloads independently.
  Rejected because role and organization data interpretation would drift across pages.
- Treat every missing privilege as unauthenticated and redirect to sign-in.
  Rejected because it hides authorization failures and makes operator/user troubleshooting harder.

### Decision: Validate with focused route and component tests
The migrated auth pages and fallback routes should be covered with targeted Vitest tests around route rendering, form states, and redirect outcomes. Playwright can remain a follow-up unless the implementation makes browser-level coverage cheap enough to add immediately.

Alternatives considered:
- Rely on manual navigation only.
  Rejected because route guards and fallback pages are easy to regress and inexpensive to test.
- Add only end-to-end browser tests.
  Rejected because the first confidence signal should be fast, local, and narrow.

## Risks / Trade-offs

- The migrated `/cadastro` page may look more complete than its backend support -> Mitigation: keep the design explicit that this route preserves the current request-access UX instead of pretending to provision accounts.
- Better Auth session payloads may expose runtime fields that are awkward in generated frontend types -> Mitigation: normalize session data inside the auth module instead of leaking raw generated types through the app.
- Redirect rules can become confusing if public and protected routes both infer session state ad hoc -> Mitigation: centralize auth-aware redirects in app-level guards and route composition.

## Migration Plan

This is a frontend-only migration. Move the legacy auth page implementations into module-owned files, add the auth adapters and app-level routing/guard updates, wire the fallback pages, and ship the updated tests together. Roll back by removing the new auth module routes and restoring the current landing-only route tree.

## Open Questions

None. A future dedicated backend contract for public access requests can extend `/cadastro` later without blocking this migration.