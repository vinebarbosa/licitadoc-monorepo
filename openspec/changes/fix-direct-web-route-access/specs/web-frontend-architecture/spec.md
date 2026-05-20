## ADDED Requirements

### Requirement: Web deployment MUST preserve SPA route ownership
The web deployment configuration MUST route client-owned, non-asset URLs to the Vite SPA entrypoint so centralized React Router route composition remains authoritative in deployed environments.

#### Scenario: Client-owned route is requested directly
- **WHEN** the deployed web host receives a direct request for a client-owned route such as `/app/processos` or `/admin/usuarios`
- **THEN** the request resolves to the built web SPA entrypoint
- **AND** the React router handles route matching, redirects, and guards

#### Scenario: Static asset is requested
- **WHEN** the deployed web host receives a request for a built static asset, image, stylesheet, script, source map, or other file path
- **THEN** the request is served as that asset or returned as a host-level missing file response
- **AND** it is not rewritten into the SPA entrypoint

#### Scenario: API path is requested
- **WHEN** the deployed web host receives a request for an `/api/*` path
- **THEN** the SPA fallback does not capture the request
- **AND** backend/API routing remains outside the web app router
