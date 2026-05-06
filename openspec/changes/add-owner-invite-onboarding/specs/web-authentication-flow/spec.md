## MODIFIED Requirements

### Requirement: Sign-in route MUST authenticate against the existing auth contract
The `/entrar` route MUST submit credentials through the existing frontend auth integration and MUST reflect both successful and failed authentication outcomes.

#### Scenario: Visitor signs in with valid credentials
- **WHEN** a visitor submits valid credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the visitor to the post-authenticated destination configured by the app

#### Scenario: Invited owner signs in with temporary credentials
- **WHEN** an invited `organization_owner` submits valid temporary credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the router navigates the user to the first incomplete owner onboarding step instead of the main app

#### Scenario: Visitor signs in with invalid credentials
- **WHEN** a visitor submits invalid credentials on `/entrar`
- **THEN** the app stays on the sign-in page
- **AND** the visitor sees an authentication error message without a full page reload

### Requirement: Protected web routes MUST enforce session-aware access decisions
The web app MUST use session-aware route protection so unauthenticated, unauthorized, and onboarding-incomplete visitors are handled differently.

#### Scenario: Unauthenticated visitor hits a protected route
- **WHEN** a visitor without an active session opens a protected route
- **THEN** the app redirects the visitor to the sign-in route

#### Scenario: Authenticated visitor lacks permission for a protected route
- **WHEN** an authenticated visitor opens a protected route without the required authorization
- **THEN** the app redirects the visitor to the unauthorized route

#### Scenario: Invited owner opens the app before completing profile setup
- **WHEN** an authenticated `organization_owner` with onboarding status `pending_profile` opens a protected app route
- **THEN** the app redirects the user to owner profile onboarding

#### Scenario: Invited owner opens the app before completing organization setup
- **WHEN** an authenticated `organization_owner` with onboarding status `pending_organization` opens a protected app route
- **THEN** the app redirects the user to organization onboarding
