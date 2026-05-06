# web-public-landing-page Specification

## Purpose
Defines the public LicitaDoc landing page route, modular ownership, shared design-system usage, navigation compatibility, and smoke coverage expectations.

## Requirements
### Requirement: Public landing page MUST be available from the web app
The frontend MUST provide the migrated LicitaDoc public landing page through the Vite React app router.

#### Scenario: Visitor opens the public landing route
- **WHEN** a visitor navigates to the configured public landing route
- **THEN** the app renders the LicitaDoc landing page with hero messaging, navigation links, feature sections, process steps, call to action, and footer
- **AND** the route is composed by the centralized app router

### Requirement: Public landing page MUST follow modular frontend boundaries
The landing page MUST live inside a frontend module and MUST not be imported from `tmp`.

#### Scenario: Developer inspects landing page ownership
- **WHEN** a developer looks for the landing page implementation
- **THEN** the route entrypoint is exported from a module under `apps/web/src/modules`
- **AND** runtime code does not import from `tmp/landing.tsx`

### Requirement: Public landing page MUST use shared design-system primitives
The landing page MUST import reusable primitives from the shared design-system boundary.

#### Scenario: Landing page renders shared UI
- **WHEN** the landing page uses primitives such as buttons, cards, or separators
- **THEN** those primitives are imported from `@/shared/ui`
- **AND** the page does not use legacy `@/components/ui` aliases

### Requirement: Public landing route MUST preserve smoke coverage
The frontend MUST keep automated coverage for both the migrated public landing page and the existing API/session smoke behavior.

#### Scenario: Frontend validations run after landing migration
- **WHEN** `@licitadoc/web` Vitest and Playwright checks run
- **THEN** at least one test validates stable landing page content on its route
- **AND** the API health/session smoke behavior remains covered on a stable route

### Requirement: Public landing page links MUST be client-router compatible
Internal landing page navigation MUST use React Router-compatible links while same-page anchors remain standard fragment links.

#### Scenario: Visitor uses landing page navigation
- **WHEN** the visitor clicks internal app links such as access or registration actions
- **THEN** those links use the app router link component
- **AND** section links such as features, process explanation, or contact navigate to the page fragments without requiring a backend round trip
