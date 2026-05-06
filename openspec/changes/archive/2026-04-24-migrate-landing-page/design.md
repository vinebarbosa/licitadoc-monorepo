## Context

`tmp/landing.tsx` contains a complete LicitaDoc public landing page that uses React Router links, Lucide icons, and shadcn-style primitives through the old `@/components/ui` alias. The frontend now has a modular architecture in `apps/web` with app composition under `src/app`, product/public modules under `src/modules`, and reusable design-system primitives under `src/shared/ui`.

The current root route renders the `home` smoke page and validates API/client wiring. The landing migration should introduce the public marketing screen without losing the existing smoke behavior unless the route change is made intentionally and tested.

## Goals / Non-Goals

**Goals:**

- Move the landing page source from `tmp/landing.tsx` into `apps/web/src/modules`.
- Use the shared design-system boundary for Button, Card, Separator, and other primitives.
- Make the landing page reachable through the centralized app router.
- Keep the page Vite-compatible by using `react-router-dom` and avoiding temporary aliases.
- Add route and component smoke coverage for the migrated page.
- Preserve the existing backend/API smoke page behavior under a stable route if `/` becomes the landing page.

**Non-Goals:**

- Implement authentication, registration, terms, privacy, or contact workflows.
- Change backend APIs or generated client contracts.
- Add a CMS, analytics, SEO framework, or server rendering.
- Redesign the provided landing content beyond the minimum needed for architecture, responsiveness, accessibility, and test stability.

## Decisions

### Put the landing page in a dedicated public module

The page will live under a module such as `src/modules/public/pages/landing-page.tsx` and be exported from that module public API. This keeps marketing/public route code out of app composition while still treating it as a browser-facing workflow.

Alternative considered: place it under `src/shared` because it is not backend-backed. That would blur the shared boundary: the landing page has product messaging and route behavior, so it belongs in a module rather than reusable infrastructure.

### Keep router composition centralized

`src/app/router.tsx` will compose the landing route through the existing route tree. If `/` is assigned to the landing page, the current health/session smoke page should move to a named route such as `/status` so existing API smoke behavior remains available and testable.

Alternative considered: render the landing page directly in `main.tsx`. That would bypass the app architecture and make later route guards/providers harder to reason about.

### Reuse shared UI and tokens directly

The migrated page will import primitives from `@/shared/ui/*` and rely on `src/styles.css` design tokens. Legacy `@/components/ui` imports and runtime imports from `tmp` are not allowed.

Alternative considered: copy local button/card markup into the landing module. That would duplicate design-system behavior and make the migration drift from the new shared UI foundation.

### Keep tests at the route and component level

Vitest should assert the landing page imports and renders stable content. Playwright should cover the route users will visit, including at least the hero and primary call to action. Existing home/status route tests should be updated if route paths change.

Alternative considered: only rely on visual/manual browser inspection. That would make a marketing page easy to break during routing or alias refactors.

## Risks / Trade-offs

- [Risk] `/cadastro`, `/entrar`, `/termos`, and `/privacidade` may not exist yet. → Keep these as navigational targets only and test the landing page without requiring those routes to resolve.
- [Risk] Moving `/` from smoke page to landing page can hide API health smoke coverage. → Preserve the current smoke page under a named route and update tests.
- [Risk] Large single-file landing markup can become hard to maintain. → Start with a page module and extract local arrays/section helpers only where it improves readability without inventing broad abstractions.
- [Risk] The provided page uses visual effects and responsive layouts that may regress on small screens. → Include route smoke coverage and keep classes aligned with existing Tailwind/design-system tokens.
