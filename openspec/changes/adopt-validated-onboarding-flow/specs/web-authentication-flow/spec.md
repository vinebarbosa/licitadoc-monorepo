## MODIFIED Requirements

### Requirement: Sign-in route MUST authenticate against the existing auth contract
The `/entrar` route MUST submit credentials through the existing frontend auth integration and MUST navigate the visitor to the next route implied by authenticated onboarding state, role, and requested destination.

#### Scenario: Visitor signs in with valid credentials and no incomplete onboarding
- **WHEN** a visitor submits valid credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to the requested post-authenticated destination or `/app` when no safe destination was requested

#### Scenario: Invited user with pending profile onboarding signs in
- **WHEN** a visitor submits valid credentials on `/entrar` and the resulting session reports `onboardingStatus` `pending_profile`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to `/onboarding/perfil`

#### Scenario: Organization owner with pending organization onboarding signs in
- **WHEN** a visitor submits valid credentials on `/entrar` and the resulting session reports `onboardingStatus` `pending_organization`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to `/onboarding/organizacao`

#### Scenario: Visitor signs in with invalid credentials
- **WHEN** a visitor submits invalid credentials on `/entrar`
- **THEN** the app stays on the sign-in page
- **AND** the visitor sees an authentication error message without a full page reload

### Requirement: Protected web routes MUST enforce session-aware access decisions
The web app MUST use session-aware route protection so unauthenticated, unauthorized, and not-yet-onboarded visitors are routed to the correct destination before protected app content renders.

#### Scenario: Unauthenticated visitor hits a protected route
- **WHEN** a visitor without an active session opens a protected route
- **THEN** the app redirects the visitor to the sign-in route

#### Scenario: Authenticated visitor lacks permission for a protected route
- **WHEN** an authenticated visitor opens a protected route without the required authorization
- **THEN** the app redirects the visitor to the unauthorized route

#### Scenario: Pending-profile user hits a protected app route
- **WHEN** an authenticated user with `onboardingStatus` `pending_profile` opens a protected app route
- **THEN** the app redirects the user to `/onboarding/perfil`

#### Scenario: Pending-organization owner hits a protected app route
- **WHEN** an authenticated `organization_owner` with `onboardingStatus` `pending_organization` opens a protected app route
- **THEN** the app redirects the user to `/onboarding/organizacao`
