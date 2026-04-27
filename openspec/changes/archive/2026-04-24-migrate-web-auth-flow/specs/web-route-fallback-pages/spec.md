## ADDED Requirements

### Requirement: Unauthorized route MUST provide a dedicated access-denied experience
The web app MUST expose a dedicated unauthorized page for authenticated visitors who reach a route they are not allowed to access.

#### Scenario: Visitor is redirected to unauthorized page
- **WHEN** the app determines an authenticated visitor lacks permission for a route
- **THEN** the visitor lands on the unauthorized page
- **AND** the page explains that access was denied and offers a clear navigation path away from the error state

### Requirement: Unknown routes MUST render a dedicated not-found page
The web app MUST render a dedicated not-found experience when no configured route matches the current URL.

#### Scenario: Visitor opens an unknown route
- **WHEN** a visitor navigates to a URL that is not registered in the app router
- **THEN** the app renders the not-found page instead of a blank screen or uncaught router error
- **AND** the page offers a clear route back to a known page

### Requirement: Fallback pages MUST be composed by the centralized router
Unauthorized and not-found route states MUST be integrated into the centralized app router rather than being handled ad hoc inside individual pages.

#### Scenario: Contributor inspects fallback routing
- **WHEN** a contributor looks at the web route configuration
- **THEN** the unauthorized page is reachable through an explicit router entry
- **AND** the not-found page is reached through the router fallback path