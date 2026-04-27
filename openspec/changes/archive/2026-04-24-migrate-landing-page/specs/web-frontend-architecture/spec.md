## ADDED Requirements

### Requirement: Web architecture MUST place public pages in modules
The frontend architecture MUST treat public marketing or informational pages as module-owned route entrypoints rather than app composition or shared UI.

#### Scenario: Developer adds a public marketing page
- **WHEN** a developer adds a public page such as a landing page
- **THEN** the page implementation lives under an appropriate module in `apps/web/src/modules`
- **AND** the centralized app router composes that module entrypoint into the route tree
- **AND** shared UI remains limited to reusable primitives and utilities rather than page-specific marketing content
