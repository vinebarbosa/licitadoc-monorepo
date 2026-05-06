## ADDED Requirements

### Requirement: Web design system MUST live in the shared UI boundary
The system MUST expose migrated design-system primitives from `apps/web/src/shared/ui` so product modules can consume reusable UI without owning design-system implementation details.

#### Scenario: Product module uses a design-system primitive
- **WHEN** a product module needs a reusable primitive such as a button, card, input, dialog, table, badge, or select
- **THEN** the module imports it from the shared UI boundary
- **AND** the primitive does not live inside a product module

### Requirement: Web design-system hooks MUST live in shared hooks
Generic design-system hooks migrated from `tmp/web` MUST live in a shared hooks boundary rather than inside product modules.

#### Scenario: Design-system component needs a generic hook
- **WHEN** a shared UI component needs behavior such as mobile viewport detection or toast state
- **THEN** it imports the hook from the shared hooks boundary
- **AND** the hook remains reusable by modules outside the component's internal file

### Requirement: Web design system MUST provide shared styling tokens
The frontend MUST expose the design-system global styles, CSS variables, status colors, dark-mode variables, radius tokens, and Tailwind theme mappings from the app stylesheet.

#### Scenario: Shared primitive renders with design tokens
- **WHEN** a migrated design-system primitive renders in `apps/web`
- **THEN** its Tailwind classes can resolve the expected background, foreground, border, ring, status, sidebar, radius, and chart tokens
- **AND** the app stylesheet remains compatible with the Vite Tailwind setup

### Requirement: Web design-system imports MUST match the modular architecture
Migrated design-system source MUST NOT depend on the temporary `tmp/web` paths or incompatible aliases.

#### Scenario: Migrated component imports another primitive
- **WHEN** a migrated component imports another shared primitive, hook, or utility
- **THEN** it uses the `@/shared/ui`, `@/shared/hooks`, or `@/shared/lib` path that matches the app architecture
- **AND** no runtime code imports from `tmp/web`

### Requirement: Web design-system configuration MUST target the app layout
The frontend shadcn-style `components.json` configuration MUST point future component additions at the shared UI, shared hook, and shared utility paths used by `apps/web`.

#### Scenario: Contributor adds another design-system primitive
- **WHEN** a contributor uses the component configuration to add UI code later
- **THEN** generated or copied component code targets the shared design-system boundaries
- **AND** the configuration stays compatible with Vite React rather than React Server Components

### Requirement: Web design-system dependencies MUST be declared by the web package
The web package MUST declare the runtime dependencies required by the migrated design-system components.

#### Scenario: Frontend dependencies are installed from scratch
- **WHEN** a developer installs the workspace and runs the web app or tests
- **THEN** all packages imported by migrated design-system files resolve from `@licitadoc/web`
- **AND** no migrated component relies on undeclared transitive dependencies

### Requirement: Web design-system migration MUST preserve existing app behavior
The migration MUST keep the current Vite app route, app providers, home smoke screen, health/session checks, and frontend tests functional.

#### Scenario: Design-system migration is applied
- **WHEN** the design-system files, styles, dependencies, and config are migrated into `apps/web`
- **THEN** the existing home route still renders successfully
- **AND** typecheck, lint, Vitest, and Playwright validation remain runnable for `@licitadoc/web`

### Requirement: Web design-system primitives MUST have smoke coverage
The frontend test suite MUST include smoke coverage that imports and renders representative migrated design-system primitives.

#### Scenario: Developer validates the migrated design system
- **WHEN** the frontend unit/component test command runs
- **THEN** at least one test renders representative shared UI primitives with required providers
- **AND** the test fails if the migrated components cannot be imported or rendered in the Vite test environment
