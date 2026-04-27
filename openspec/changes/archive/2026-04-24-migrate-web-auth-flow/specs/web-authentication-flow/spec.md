## ADDED Requirements

### Requirement: Public authentication routes MUST be available in the web router
The web app MUST expose migrated public auth routes for sign-in, request access, and password recovery through the centralized app router.

#### Scenario: Visitor opens a migrated auth route
- **WHEN** a visitor navigates to `/entrar`, `/cadastro`, or `/recuperar-senha`
- **THEN** the app renders the corresponding auth page through a module-owned route entrypoint
- **AND** the runtime code does not depend on `tmp` files

### Requirement: Sign-in route MUST authenticate against the existing auth contract
The `/entrar` route MUST submit credentials through the existing frontend auth integration and MUST reflect both successful and failed authentication outcomes.

#### Scenario: Visitor signs in with valid credentials
- **WHEN** a visitor submits valid credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to the post-authenticated destination configured by the app

#### Scenario: Visitor signs in with invalid credentials
- **WHEN** a visitor submits invalid credentials on `/entrar`
- **THEN** the app stays on the sign-in page
- **AND** the visitor sees an authentication error message without a full page reload

### Requirement: Password recovery route MUST request a reset safely
The `/recuperar-senha` route MUST call the existing password reset contract and MUST present a neutral confirmation state after submission.

#### Scenario: Visitor requests password recovery
- **WHEN** a visitor submits an e-mail address on `/recuperar-senha`
- **THEN** the app sends the password reset request through the existing auth contract
- **AND** the visitor sees a confirmation state that does not disclose whether the e-mail exists

### Requirement: Request-access route MUST preserve the migrated public onboarding experience
The `/cadastro` route MUST provide the migrated request-access experience from the legacy frontend and MUST keep a deterministic submission acknowledgment flow.

#### Scenario: Visitor submits the request-access form
- **WHEN** a visitor completes and submits the public request-access form on `/cadastro`
- **THEN** the app shows the migrated acknowledgment state for that flow
- **AND** the route keeps the public navigation options back to sign-in or other public pages

### Requirement: Protected web routes MUST enforce session-aware access decisions
The web app MUST use session-aware route protection so unauthenticated and unauthorized visitors are handled differently.

#### Scenario: Unauthenticated visitor hits a protected route
- **WHEN** a visitor without an active session opens a protected route
- **THEN** the app redirects the visitor to the sign-in route

#### Scenario: Authenticated visitor lacks permission for a protected route
- **WHEN** an authenticated visitor opens a protected route without the required authorization
- **THEN** the app redirects the visitor to the unauthorized route