## ADDED Requirements

### Requirement: Public authentication routes MUST support direct deployed access
The deployed web app MUST serve the SPA entrypoint for public authentication routes so the centralized app router can render them from a direct browser request or page reload.

#### Scenario: Visitor opens sign-in URL directly
- **WHEN** a visitor requests `/entrar` directly from the deployed web host
- **THEN** the host serves the web SPA entrypoint
- **AND** the app renders the sign-in page through the centralized router
- **AND** the visitor does not see a host-level 404 page

#### Scenario: Visitor reloads a public auth route
- **WHEN** a visitor reloads `/cadastro` or `/recuperar-senha` on the deployed web host
- **THEN** the host serves the web SPA entrypoint
- **AND** the app renders the matching public auth page without losing the clean URL path
