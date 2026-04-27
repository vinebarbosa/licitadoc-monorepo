## ADDED Requirements

### Requirement: Admin users can access the management page at the canonical admin route
The web application MUST expose the administrative user management experience at `/admin/usuarios` and MUST restrict that route to authenticated `admin` users while preserving the authenticated shell experience.

#### Scenario: Admin opens the canonical admin users route
- **WHEN** an authenticated `admin` navigates to `/admin/usuarios`
- **THEN** the system renders the administrative user management page inside the authenticated application shell

#### Scenario: Non-admin attempts to open the canonical admin users route
- **WHEN** an authenticated `organization_owner` or `member` navigates to `/admin/usuarios`
- **THEN** the system denies access and redirects the actor to the unauthorized experience

#### Scenario: Admin opens the deprecated app-scoped route
- **WHEN** an authenticated `admin` navigates to `/app/admin/usuarios`
- **THEN** the system redirects the actor to `/admin/usuarios`

### Requirement: Admin user management layout matches the legacy operational structure while using real data
The admin user management page MUST preserve real API-backed behavior and MUST present the workflow with the same operational structure as the legacy `/tmp/usuarios.tsx` screen, including summary cards, a compact filter bar, tabular user rows, row-level actions, loading feedback, empty-state feedback, and pagination controls.

#### Scenario: Admin opens the page without filters
- **WHEN** an authenticated `admin` opens `/admin/usuarios` with no active filters
- **THEN** the system shows summary cards for total visible users and counts by `admin`, `organization_owner`, and `member`
- **THEN** the system renders a table of persisted users with identity, organization, current-role, created-at, and condensed management actions

#### Scenario: Admin restores list state from query parameters
- **WHEN** an authenticated `admin` opens `/admin/usuarios` with `page`, `search`, `role`, or `organizationId` in the URL
- **THEN** the page restores those controls from the URL
- **THEN** the system requests the corresponding filtered user listing from the API

#### Scenario: Admin sees loading or empty states in the legacy layout
- **WHEN** the page is waiting for the user listing or the active filters produce no visible users
- **THEN** the system shows loading placeholders or an empty state that preserve the administrative page structure instead of falling back to mock rows or stale content

### Requirement: Admin page provisions organization owners through invites
The user management page MUST let an `admin` start onboarding a new `organization_owner` from the same administrative context by using the existing invite flow instead of direct user creation.

#### Scenario: Admin creates an organization owner invite from the page
- **WHEN** an authenticated `admin` submits the invite form with a target e-mail address and an optional organization selection
- **THEN** the system creates an `organization_owner` invite through the existing invite API
- **THEN** the page shows a successful administrative confirmation without creating a stored user record directly

### Requirement: Admin page supports managed user inspection, updates, and removal
The user management page MUST give admins a compact row-level entrypoint for management actions and MUST let an `admin` inspect a managed user, persist allowed edits, and remove a managed user with explicit confirmation.

#### Scenario: Admin opens row-level actions for a managed user
- **WHEN** an authenticated `admin` reviews a user row in the management table
- **THEN** the page exposes condensed management actions for that row without requiring permanently expanded inline controls

#### Scenario: Admin updates a managed user from the page
- **WHEN** an authenticated `admin` edits a user's allowed management fields from the administrative page
- **THEN** the system persists the update through the existing user management API
- **THEN** the page refreshes the affected user data with the stored values

#### Scenario: Admin removes a managed user from the page
- **WHEN** an authenticated `admin` confirms removal of a managed user from the administrative page
- **THEN** the system deletes the user through the existing user management API
- **THEN** the page removes that user from the current listing state