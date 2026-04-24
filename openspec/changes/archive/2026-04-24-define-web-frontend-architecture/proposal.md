## Why

`apps/web` already has the first runtime pieces in place, but its source tree is still too small to communicate where routing, API access, module code, shared UI, and application state should live as the product grows. The backend already follows module-oriented boundaries and generates an API client from OpenAPI, so the frontend needs an explicit modular architecture that aligns with those contracts without leaking backend implementation details into React components.

## What Changes

- Define a modular frontend architecture for `apps/web` with clear ownership boundaries for app bootstrap, routing, layouts, domain modules, shared UI, API integration, state, and tests.
- Add package-local documentation that explains how frontend code should consume `@licitadoc/api-client`, TanStack Query, React Router, and backend domain capabilities.
- Introduce a lightweight initial `src/modules` structure that can scale with the backend modules for auth, users, organizations, departments, processes, documents, and invites while keeping module internals private by default.
- Establish conventions for query/mutation wrappers, route composition, component placement, form boundaries, error/loading states, and generated API client usage.
- Add a separate `apps/web/agents.md` operational guide for contributors and coding agents working in the frontend package.
- Configure frontend test tooling with Vitest for component/unit tests, Playwright for browser route/e2e checks, and Mock Service Worker for API mocks shared across test layers.
- Add implementation tasks for validating the architecture with lint/typecheck/test commands and keeping the generated API client as the contract boundary.

## Capabilities

### New Capabilities
- `web-frontend-architecture`: Defines how `apps/web` must organize frontend responsibilities, integrate with backend contracts, and expose maintainable module boundaries.
- `web-test-tooling`: Defines the frontend test tooling baseline for unit/component tests, browser route/e2e tests, and API mocking.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/**`, `apps/web/architecture.md`, `apps/web/agents.md`, frontend test configuration files, MSW handlers, Playwright specs, and any small discovery links in repository documentation.
- Affected packages: `@licitadoc/web` and `@licitadoc/api-client`.
- Dependencies: adds frontend dev dependencies for Vitest, Testing Library, happydom, Playwright, and Mock Service Worker as needed.
- Backend relationship: no API behavior changes are intended, but the architecture must align with `apps/api` module boundaries and the OpenAPI-generated client surface.
- APIs: no HTTP contract changes are intended.
