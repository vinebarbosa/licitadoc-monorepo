## ADDED Requirements

### Requirement: Web implementation MUST conform to the documented frontend architecture
The live `apps/web` source tree MUST align with `apps/web/architecture.md` and `apps/web/agents.md` by placing app composition, module workflow code, shared reusable code, frontend test infrastructure, and browser tests in their documented boundaries.

#### Scenario: Developer audits the frontend source tree
- **WHEN** a developer reviews the implemented `apps/web` files after the alignment change
- **THEN** app-wide providers, query client setup, router composition, route guards, theme setup, and app-level helpers live under `apps/web/src/app`
- **AND** public and product workflow screens, module-specific adapters, model helpers, and module-owned UI live under `apps/web/src/modules`
- **AND** reusable UI primitives, generic UI hooks, layout primitives, and shared utilities live under `apps/web/src/shared`
- **AND** Vitest helpers and MSW support live under `apps/web/src/test`
- **AND** Playwright browser tests live under `apps/web/e2e`

#### Scenario: Developer checks for temporary runtime dependencies
- **WHEN** the frontend source is searched for runtime imports from temporary migration sources or legacy aliases
- **THEN** production and test runtime code does not import from `tmp`, `tmp/web`, or legacy design-system aliases such as `@/components/ui`
- **AND** migrated code uses `@/shared/ui`, `@/shared/hooks`, `@/shared/lib`, module public APIs, or documented route exports instead

### Requirement: Web module boundaries MUST be enforced by implementation imports
Frontend code outside a module MUST consume that module only through its public API or a documented route export, while module-private `api`, `model`, `ui`, and `pages` folders remain internal implementation details.

#### Scenario: Code outside a module renders module functionality
- **WHEN** app composition, another module, or a test needs a page, route entrypoint, hook, or helper owned by a module
- **THEN** it imports that dependency from `apps/web/src/modules/<module>/index.ts` or an explicitly documented route export
- **AND** it does not import directly from another module's private `api`, `model`, `ui`, or `pages` folders

#### Scenario: Product UI needs backend-backed data
- **WHEN** a module page or module UI component needs backend data or mutations
- **THEN** it consumes module-level hooks, adapters, or model helpers with product-oriented names
- **AND** generated `@licitadoc/api-client` endpoint names and query keys remain isolated to app infrastructure or the owning module's `api` boundary

### Requirement: Web architecture alignment MUST preserve route behavior and validation coverage
The alignment pass MUST keep current web routes functional and MUST maintain tests or validation checks that cover route rendering, app providers, API mocking, and architecture-sensitive import boundaries.

#### Scenario: Developer validates the aligned frontend
- **WHEN** the documented web validation commands are run after implementation
- **THEN** typecheck, lint, Vitest, and Playwright validations pass for `@licitadoc/web`
- **AND** tests continue to cover the public route, authenticated app route behavior, fallback routes, and backend-backed module behavior through deterministic mocks or module adapters

#### Scenario: Backend-backed UI behavior changes during alignment
- **WHEN** route or component behavior depends on backend health, session, user, invite, or organization responses
- **THEN** MSW fixtures and handlers are updated with the module or route change
- **AND** tests do not require a live backend or manual browser setup to exercise the behavior
