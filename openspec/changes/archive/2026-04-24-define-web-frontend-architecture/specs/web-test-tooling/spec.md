## ADDED Requirements

### Requirement: Web package MUST support Vitest unit and component tests
The system MUST configure `@licitadoc/web` with Vitest for frontend unit and component tests using a browser-like DOM environment.

#### Scenario: Developer runs frontend unit tests
- **WHEN** a developer runs the frontend unit/component test command
- **THEN** Vitest executes tests for `apps/web`
- **AND** React component tests can render with Testing Library and the app's required providers

### Requirement: Web package MUST support Playwright browser tests
The system MUST configure `@licitadoc/web` with Playwright for browser-level route and smoke checks.

#### Scenario: Developer runs browser tests
- **WHEN** a developer runs the frontend browser test command
- **THEN** Playwright starts or targets the Vite web app
- **AND** verifies at least one route-level smoke scenario without requiring a manually started browser

### Requirement: Web package MUST use Mock Service Worker for API mocks
The frontend test setup MUST use Mock Service Worker as the shared API mocking layer for backend HTTP behavior in frontend tests.

#### Scenario: Component test needs API data
- **WHEN** a component or route test needs health, session, or module API responses
- **THEN** the test uses MSW handlers instead of handwritten fetch stubs or a live backend dependency

#### Scenario: Browser test needs deterministic backend behavior
- **WHEN** a Playwright route or e2e smoke test needs backend responses
- **THEN** the test can use deterministic mocked responses or equivalent MSW-backed browser setup
- **AND** the test remains runnable without changing backend data

### Requirement: Web test commands MUST be documented and wired into package scripts
The frontend package MUST expose documented scripts for unit/component tests and browser tests.

#### Scenario: Contributor validates frontend work
- **WHEN** a contributor finishes frontend changes
- **THEN** the documented validation flow includes typecheck, lint, Vitest, and Playwright commands
- **AND** the package scripts provide those commands under `@licitadoc/web`

### Requirement: Web tests MUST preserve generated API client boundaries
Frontend tests MUST mock HTTP behavior at the network boundary or module adapter boundary and MUST NOT edit generated API client files to make tests pass.

#### Scenario: Generated API behavior changes
- **WHEN** tests fail because backend contract types or generated hooks changed
- **THEN** the fix updates backend schemas, regenerates `@licitadoc/api-client`, or updates module adapters and MSW handlers
- **AND** generated files under `packages/api-client/src/gen` remain treated as generated output
