## ADDED Requirements

### Requirement: Unknown deployed client routes MUST reach the in-app not-found page
The deployed web app MUST serve the SPA entrypoint for unknown non-asset client paths so the centralized router can render the dedicated not-found experience.

#### Scenario: Visitor opens an unknown clean URL directly
- **WHEN** a visitor requests an unknown client path such as `/rota-inexistente` directly from the deployed web host
- **THEN** the host serves the web SPA entrypoint
- **AND** the app router renders the dedicated not-found page
- **AND** the visitor does not see a host-level `404: NOT_FOUND` page
