## MODIFIED Requirements

### Requirement: Sign-in route MUST authenticate against the existing auth contract
The `/entrar` route MUST submit credentials through the existing frontend auth integration and MUST reflect both successful and failed authentication outcomes. After successful authentication, the frontend session state used by protected route guards MUST be reconciled before the app relies on the post-authenticated destination.

#### Scenario: Visitor signs in with valid credentials
- **WHEN** a visitor submits valid credentials on `/entrar`
- **THEN** the app establishes the authenticated session
- **AND** the frontend session query state reflects an authenticated user
- **AND** the router navigates the visitor to the post-authenticated destination configured by the app

#### Scenario: Visitor signs in from a preserved protected redirect
- **WHEN** a visitor is on `/entrar?redirectTo=%2Fapp` after being redirected from `/app`
- **AND** the visitor submits valid credentials
- **THEN** the app establishes the authenticated session
- **AND** the protected `/app` route renders instead of redirecting back to `/entrar`

#### Scenario: Visitor signs in with invalid credentials
- **WHEN** a visitor submits invalid credentials on `/entrar`
- **THEN** the app stays on the sign-in page
- **AND** the visitor sees an authentication error message without a full page reload
