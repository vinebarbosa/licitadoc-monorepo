## ADDED Requirements

### Requirement: Authenticated users MUST be able to sign out from the app shell
The web app MUST provide a logout action inside authenticated application chrome that terminates the active auth session through the existing auth contract, updates frontend session state, and leaves protected application space.

#### Scenario: Authenticated user signs out successfully
- **WHEN** an authenticated user triggers `Sair` from the app shell user menu
- **THEN** the app calls the existing sign-out auth contract
- **AND** the frontend session state no longer represents an authenticated user
- **AND** the router navigates the user to `/entrar`

#### Scenario: Signed-out user attempts to reopen the app shell
- **WHEN** a user signs out and then navigates to `/app`
- **THEN** the app treats the user as unauthenticated
- **AND** the protected route guard redirects the user to the sign-in route

#### Scenario: Logout request is pending
- **WHEN** the user has triggered logout and the sign-out request is still pending
- **THEN** the logout action does not submit duplicate sign-out requests
