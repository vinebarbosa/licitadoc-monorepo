## Context

`apps/web` is a Vite React application with React Router and TanStack Query already wired at the app root. It currently has a minimal route tree under `src/routes`, a single `HomePage`, global styles, and direct usage of generated hooks from `@licitadoc/api-client`.

The backend is intentionally module-oriented. `apps/api` exposes route modules for auth, invites, users, organizations, departments, processes, and documents, with public contracts generated from Zod/OpenAPI into `packages/api-client`. The frontend should adopt a similar modular shape, but its modules should be UI/product boundaries rather than copies of backend internals.

This change defines the architecture and the testing foundation before the first larger screens arrive. It should answer where a new route, module adapter, page, reusable component, test helper, or API mock belongs.

## Goals / Non-Goals

**Goals:**
- Document the intended `apps/web` modular architecture close to the package.
- Add a separate `apps/web/agents.md` with active-work guidance for contributors and coding agents.
- Establish a source layout with explicit boundaries for app composition, module internals, shared code, routes, and tests.
- Preserve `@licitadoc/api-client` as the generated HTTP contract boundary and prevent handwritten fetch calls from spreading through React code.
- Define module conventions for public exports, internal folders, API adapters, query/mutation wrappers, UI components, pages, and route registration.
- Configure Vitest, Playwright, and Mock Service Worker so route/component behavior can be tested before full product screens are built.
- Keep the initial implementation small enough to land without forcing every backend module to receive complete screens immediately.

**Non-Goals:**
- Redesigning the visual language of the application.
- Changing backend routes, schemas, auth behavior, or database models.
- Replacing Kubb, React Router, TanStack Query, Vite, or Tailwind.
- Building complete CRUD screens for every backend module as part of the architecture change.
- Treating generated files in `packages/api-client/src/gen` as editable source.
- Adding a full visual regression pipeline or CI browser matrix in this change.

## Decisions

### Decision: Use `src/modules` as the primary product boundary

`apps/web/src` should be organized around modular product boundaries:

- `app/`: process-wide composition such as providers, query client configuration, router creation, route guards, environment config, and application-level error boundaries.
- `modules/<module>/`: domain or workflow modules such as `auth`, `organizations`, `departments`, `processes`, `documents`, `users`, and `invites`.
- `shared/`: reusable UI primitives, layout primitives, formatting, browser utilities, and cross-module helpers that do not depend on one product workflow.
- `test/`: Vitest setup, Testing Library render helpers, MSW server/browser setup, mock handlers, and shared fixtures.
- `e2e/`: Playwright specs and browser-level route checks.

Each module may use this internal shape as needed:

- `api/`: generated-client adapters, query options, mutation helpers, and invalidation behavior.
- `model/`: module-specific types, mappers, policies, derived state, and constants.
- `ui/`: reusable UI pieces that are specific to the module.
- `pages/`: route entrypoints for the module.
- `routes.tsx`: optional module route definitions consumed by app-level router composition.
- `index.ts`: the module's public API for code outside the module.

Alternatives considered:
- Keep using `features/`. Rejected because the requested direction is explicitly modular and the backend already speaks in module boundaries.
- Mirror backend module folders exactly. Rejected because frontend modules are allowed to model UI workflows, not persistence or route-handler internals.
- Put every page directly under `routes/`. Rejected because route files would accumulate module data access, state, and presentation responsibilities.

### Decision: Enforce module privacy by convention first

Cross-module imports should go through a module's `index.ts` or explicitly documented route exports. Code outside a module should not import from another module's internal `api`, `model`, `ui`, or `pages` folders.

This can start as documentation and review guidance. If drift appears later, a future change can add import-boundary lint rules.

Alternatives considered:
- Add strict lint boundaries immediately. Deferred because the source tree is still tiny and the first pass should establish shape before adding enforcement tooling.
- Allow arbitrary relative imports between modules. Rejected because modular architecture loses value when internals are treated as public.

### Decision: Use generated API hooks through module-level adapters

Generated Kubb exports from `@licitadoc/api-client` remain the source of typed HTTP calls and TanStack Query hooks. Product pages and components should normally consume module-level hooks or service adapters that:

- normalize generated endpoint names into product language,
- choose stable query options where customization is needed,
- centralize mutation invalidation,
- adapt API error payloads into UI-friendly messages,
- keep module UI from depending on generated names such as `useGetApiProcesses`.

Direct imports from `@licitadoc/api-client` are acceptable inside module `api/` folders, app-level session/bootstrap code, and temporary smoke screens. They should not become the dominant pattern inside reusable visual components.

Alternatives considered:
- Wrap every generated hook immediately. Rejected because it creates ceremony before workflows exist.
- Import generated hooks everywhere. Rejected because generated names and endpoint granularity become sticky UI dependencies.
- Handwrite a second API client in `apps/web`. Rejected because `packages/api-client` already exists to prevent contract drift.

### Decision: Keep router composition centralized but module-owned routes possible

The app router should remain the single composition point for URL structure, layouts, providers, guards, and route-level error handling. Individual modules may export route objects or route entrypoints, but the final tree belongs in `app/router` so navigation remains visible in one place.

Alternatives considered:
- Hide all routes inside modules. Rejected because it makes global navigation and layout composition harder to inspect.
- Keep route files as the main product layer. Rejected because route files should compose module pages, not own module logic.

### Decision: Create `apps/web/architecture.md` and `apps/web/agents.md`

`architecture.md` should be the durable design map: module boundaries, source layout, API contract boundary, route composition, testing strategy, and extension rules.

`agents.md` should be the operational playbook: commands, safe edit workflow, package boundaries, generated file rules, validation steps, and where to add different kinds of frontend changes.

Alternatives considered:
- Keep everything in `architecture.md`. Rejected because the user prefers a separate `agents.md`, and active-work guidance has a different reading mode than architecture reference.
- Put frontend guidance only in the repository root. Rejected because this is package-specific and should live next to frontend code.

### Decision: Configure Vitest for unit and component tests

Vitest should cover fast feedback for module utilities, adapters, route guards, provider behavior, and React component tests. The setup should include Testing Library, happydom, and a shared render helper that wraps router/query providers as needed.

MSW should back component tests when they need HTTP-level behavior, so tests exercise API usage without requiring the real backend.

Alternatives considered:
- Wait until real screens exist. Rejected because the user wants test tooling configured now and route-level seams are easier to establish while architecture is being laid out.
- Use only Playwright for UI tests. Rejected because browser tests are slower and not ideal for every module utility or small component state.

### Decision: Configure Playwright for browser route and e2e checks

Playwright should run against the Vite app and validate browser-level routing, provider boot, and current smoke behavior. It should use MSW or deterministic test fixtures where practical so tests do not depend on a live backend for basic frontend coverage.

Alternatives considered:
- Depend on the real API for all browser tests. Rejected because frontend route tests should be deterministic and useful before backend services are running.
- Add a large e2e suite immediately. Rejected because this change is architecture and tooling; broader workflow coverage should arrive with real screens.

### Decision: Use MSW as the shared API mocking layer

MSW should provide mock handlers for current health/session smoke checks and a structure for module-specific handlers as screens are added. The same handler concepts should support Vitest and Playwright, even if the exact bootstrap differs between happydom and browser tests.

Alternatives considered:
- Mock generated hooks directly. Rejected because it bypasses API integration behavior and makes tests less representative.
- Build ad hoc fetch stubs per test. Rejected because that repeats contract data and drifts quickly.

## Risks / Trade-offs

- [Architecture docs drift from implementation] -> Keep the document anchored to actual folders, commands, and package boundaries, and update it when adding new frontend modules.
- [Module adapters become boilerplate] -> Add adapters only when they name product concepts, centralize invalidation/error behavior, or keep generated endpoint names out of module UI.
- [The structure feels too large for the current app] -> Create only the directories and examples needed to establish direction; avoid empty speculative module trees.
- [Backend and frontend modules do not match perfectly] -> Document that backend modules are contract inputs while frontend modules are product workflow boundaries.
- [MSW handlers duplicate backend examples] -> Keep handlers close to generated client types and refresh them when API contracts change.
- [Playwright adds setup cost] -> Start with smoke-level route coverage and leave broader e2e workflows to later product changes.

## Migration Plan

1. Add `apps/web/architecture.md` describing modular layout, module boundaries, API client usage, routing, testing strategy, and validation commands.
2. Add `apps/web/agents.md` as the short operational guide for frontend contributors and agents.
3. Move app-wide provider/router setup into `src/app` while preserving the current runtime behavior.
4. Introduce the minimal `src/modules`, `src/shared`, `src/test`, and `e2e` structure needed by current code and tests.
5. Configure Vitest, Testing Library, happydom, Playwright, and MSW in `@licitadoc/web`.
6. Keep the current home route working and add smoke coverage for route rendering with mocked health/session responses.
7. Run typecheck, lint, unit/component tests, and Playwright checks.

Rollback is straightforward: revert the frontend documentation, scaffolding, test configuration, and dependency changes. No data migration or backend rollout is required.

## Open Questions

No open questions. The frontend guide should include a separate `agents.md`, and this change should configure Vitest, Playwright, and Mock Service Worker now.
