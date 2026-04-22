# auth-e2e-coverage Specification

## Purpose
TBD - created by archiving change add-auth-flow-e2e-tests. Update Purpose after archive.
## Requirements
### Requirement: Authentication E2E coverage MUST verify the session lifecycle over real HTTP
The system MUST include API end-to-end tests that exercise the real authentication endpoints over HTTP and verify session creation, session reuse, and session invalidation using response cookies.

#### Scenario: Email sign-up creates a session automatically
- **WHEN** an E2E test signs up a new user through the email/password auth endpoint using valid data
- **THEN** the test observes a successful auth response and can use the returned session cookie in follow-up requests

#### Scenario: Signed-in user can read the current session
- **WHEN** an E2E test calls the session endpoint with a valid auth cookie from a previous successful auth action
- **THEN** the system returns the authenticated user session

#### Scenario: Sign-out invalidates the active session
- **WHEN** an E2E test signs out using a valid authenticated session
- **THEN** subsequent requests that depend on that session are no longer authenticated

### Requirement: Authentication E2E coverage MUST verify protected-route access
The system MUST include API end-to-end tests that prove a valid auth session reaches protected application routes and that missing auth is rejected.

#### Scenario: Authenticated user reaches a protected route
- **WHEN** an E2E test calls an authenticated application route with a valid session cookie
- **THEN** the system returns the route response according to the authenticated user's access rules

#### Scenario: Unauthenticated request is rejected by a protected route
- **WHEN** an E2E test calls the same protected application route without a valid session cookie
- **THEN** the system rejects the request as unauthenticated

### Requirement: Authentication E2E coverage MUST verify invalid credential handling
The system MUST include API end-to-end tests that cover failed email/password authentication attempts with invalid credentials.

#### Scenario: Sign-in with invalid password fails
- **WHEN** an E2E test attempts to sign in an existing user with the wrong password
- **THEN** the system rejects the request and does not issue a usable authenticated session

### Requirement: Authentication E2E coverage MUST run in an isolated and repeatable environment
The system MUST provide a repeatable way to execute the auth E2E suite against isolated test data so repeated local or CI runs do not depend on pre-existing auth state.

#### Scenario: E2E auth run starts from clean auth state
- **WHEN** the auth E2E suite starts
- **THEN** it prepares or cleans the required auth-related test data so the covered scenarios can run deterministically

