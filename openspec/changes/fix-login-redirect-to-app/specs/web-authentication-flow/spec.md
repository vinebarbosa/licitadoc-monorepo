## MODIFIED Requirements

### Requirement: Sign-in route MUST authenticate against the existing auth contract
The `/entrar` route MUST submit credentials through the existing frontend auth integration and MUST reflect both successful and failed authentication outcomes. When no valid redirect target is provided, the route MUST navigate successful sign-ins to the authenticated app shell at `/app`.

#### Scenario: Visitor signs in with valid credentials and no redirect target
- **WHEN** a visitor submits valid credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to `/app`

#### Scenario: Visitor signs in with valid credentials and a safe redirect target
- **WHEN** a visitor submits valid credentials on `/entrar?redirectTo=/app/processos`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to `/app/processos`

#### Scenario: Visitor signs in with invalid credentials
- **WHEN** a visitor submits invalid credentials on `/entrar`
- **THEN** the app stays on the sign-in page
- **AND** the visitor sees an authentication error message without a full page reload

#### Scenario: Visitor signs in with an unsafe redirect target
- **WHEN** a visitor submits valid credentials on `/entrar?redirectTo=https://example.test`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to `/app`

### Requirement: Protected web routes MUST enforce session-aware access decisions
The web app MUST use session-aware route protection so unauthenticated and unauthorized visitors are handled differently. When an unauthenticated visitor is redirected to sign in from a protected route, the app MUST preserve the attempted same-origin route as the sign-in redirect target.

#### Scenario: Unauthenticated visitor hits a protected route
- **WHEN** a visitor without an active session opens `/app/processos?status=aberto`
- **THEN** the app redirects the visitor to `/entrar?redirectTo=%2Fapp%2Fprocessos%3Fstatus%3Daberto`

#### Scenario: Authenticated visitor lacks permission for a protected route
- **WHEN** an authenticated visitor opens a protected route without the required authorization
- **THEN** the app redirects the visitor to the unauthorized route
