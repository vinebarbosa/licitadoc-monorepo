# web-frontend-architecture Specification

## Purpose
TBD - created by archiving change define-web-frontend-architecture. Update Purpose after archive.
## Requirements
### Requirement: Web package MUST document its modular frontend architecture
The system MUST include package-local architecture documentation for `apps/web` that explains the modular frontend source layout, major responsibilities, backend contract boundary, and validation workflow.

#### Scenario: Contributor plans a frontend change
- **WHEN** a contributor opens the frontend architecture documentation before editing `apps/web`
- **THEN** the document identifies where app composition, modules, shared UI, API integration, routes, test helpers, and browser tests belong
- **AND** the document explains how frontend modules align with backend modules and the generated API client without copying backend internals

### Requirement: Web package MUST expose an agent-facing operational guide
The system MUST include `apps/web/agents.md` as a practical guide for contributors and coding agents working in the frontend package.

#### Scenario: Contributor needs to perform a frontend change safely
- **WHEN** a contributor or agent opens `apps/web/agents.md` before editing the frontend package
- **THEN** the document explains the package role, key local commands, generated-file rules, expected workflow, and validation steps
- **AND** the document identifies where to place app, module, shared UI, API adapter, route, and test changes inside `apps/web`

### Requirement: Web source layout MUST use modules as product boundaries
The frontend source tree MUST use `src/modules` as the primary home for product workflow code and MUST keep app-wide composition and shared reusable code outside module internals.

#### Scenario: Developer adds app-wide behavior
- **WHEN** a developer adds process-wide behavior such as providers, query client configuration, route guards, router creation, environment configuration, or app-level error boundaries
- **THEN** the behavior is placed under the app composition area rather than inside a product module

#### Scenario: Developer adds a product workflow
- **WHEN** a developer adds UI and behavior for a product workflow such as auth, organizations, departments, processes, documents, users, or invites
- **THEN** the workflow code is placed in an appropriate module under `src/modules`
- **AND** route files compose module page entrypoints instead of owning reusable module logic

### Requirement: Web modules MUST protect their internals
Each frontend module MUST expose a small public API and treat internal `api`, `model`, `ui`, `pages`, and route implementation files as private to that module unless explicitly exported.

#### Scenario: Code outside a module needs module behavior
- **WHEN** code outside a module needs to render module UI, use module route entries, or call module data hooks
- **THEN** it imports from the module public export or documented route export
- **AND** it avoids importing directly from another module's internal folders

### Requirement: Web API access MUST use module-level adapters over the generated client
The frontend MUST consume backend HTTP contracts through `@licitadoc/api-client` and SHOULD isolate generated endpoint names inside app infrastructure or module `api` boundaries.

#### Scenario: Component needs backend data
- **WHEN** a component or page needs backend data
- **THEN** it uses a module-level hook or adapter backed by `@licitadoc/api-client`
- **AND** handwritten fetch calls are avoided unless explicitly documented as app infrastructure

#### Scenario: Backend contract changes
- **WHEN** a backend route schema changes and frontend types or hooks must be updated
- **THEN** the generated API client is regenerated from the backend OpenAPI output
- **AND** generated files under `packages/api-client/src/gen` are not edited manually

### Requirement: Web routing MUST remain centralized and compositional
Route composition MUST remain visible from the app router while allowing modules to provide route entrypoints or route definitions.

#### Scenario: Developer adds a protected page
- **WHEN** a developer adds a route that requires a session or role-aware access decision
- **THEN** the route composes an app-level guard or module-level access helper
- **AND** the route does not duplicate session or authorization logic inline across multiple pages

### Requirement: Web architecture MUST preserve current runtime behavior during scaffolding
The initial architecture implementation MUST keep the existing Vite React app, router, TanStack Query provider, home route, health check, and session smoke check functional.

#### Scenario: Architecture scaffolding is applied
- **WHEN** the frontend architecture folders, documentation, and module boundaries are added
- **THEN** the current app still builds and typechecks
- **AND** the home route can still render API health and session status through the generated client

