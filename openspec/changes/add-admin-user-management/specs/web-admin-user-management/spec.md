## ADDED Requirements

### Requirement: Admin users can access a dedicated user management page
The web application MUST expose a dedicated administrative route at `/app/admin/usuarios` and MUST restrict that route to authenticated `admin` users.

#### Scenario: Admin opens the user management page
- **WHEN** an authenticated `admin` navigates to `/app/admin/usuarios`
- **THEN** the system renders the administrative user management experience

#### Scenario: Non-admin attempts to open the user management page
- **WHEN** an authenticated `organization_owner` or `member` navigates to `/app/admin/usuarios`
- **THEN** the system denies access and redirects the actor to the unauthorized experience

### Requirement: Admin user management page is backed by real user data
The user management page MUST load stored users from the API, MUST show role labels aligned with the current product model, and MUST support loading, empty, and paginated result states without relying on mock data.

#### Scenario: Admin loads the page without filters
- **WHEN** an authenticated `admin` opens the page with no active filters
- **THEN** the system shows summary cards for total visible users and counts by `admin`, `organization_owner`, and `member`
- **THEN** the system renders a paginated table backed by persisted user data

#### Scenario: Admin restores list state from query parameters
- **WHEN** an authenticated `admin` opens the page with `page`, `search`, `role`, or `organizationId` in the URL
- **THEN** the page restores those controls from the URL
- **THEN** the system requests the corresponding filtered user listing from the API

#### Scenario: Admin gets an empty filtered result
- **WHEN** the active filters produce no visible users
- **THEN** the system shows an empty state for the table instead of mock rows or stale results

### Requirement: Admin page provisions organization owners through invites
The user management page MUST let an `admin` start onboarding a new `organization_owner` by creating an invite from the same administrative context.

#### Scenario: Admin creates an organization owner invite from the page
- **WHEN** an authenticated `admin` submits the invite form with a target e-mail address and an optional organization selection
- **THEN** the system creates an `organization_owner` invite through the existing invite flow
- **THEN** the page shows a successful administrative confirmation without creating a stored user record directly

### Requirement: Admin page supports managed user updates and removal
The user management page MUST let an `admin` inspect a managed user, persist allowed edits, and remove a managed user with explicit confirmation.

#### Scenario: Admin updates a managed user from the page
- **WHEN** an authenticated `admin` edits a user's allowed management fields from the administrative page
- **THEN** the system persists the update through the existing user management API
- **THEN** the page refreshes the affected row with the stored values

#### Scenario: Admin removes a managed user from the page
- **WHEN** an authenticated `admin` confirms removal of a managed user from the administrative page
- **THEN** the system deletes the user through the existing user management API
- **THEN** the page removes that user from the current listing state