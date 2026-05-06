## ADDED Requirements

### Requirement: Organization owners can access a dedicated member management page
The system MUST expose a protected member management page inside the authenticated app shell for `organization_owner` users.

#### Scenario: Organization owner opens the member management route
- **WHEN** an authenticated `organization_owner` with completed onboarding navigates to the owner member management route from the app shell
- **THEN** the system renders the dedicated member management page inside the authenticated layout
- **AND** the sidebar exposes a navigation entry for that page only to `organization_owner` users

#### Scenario: Non-owner user attempts to open the member management route
- **WHEN** an authenticated user whose role is not `organization_owner` navigates to the owner member management route
- **THEN** the system redirects that user to the unauthorized page

### Requirement: The member management page shows owner-scoped members and pending invites
The system MUST load the current organization's active members and visible pending member invites together on the owner member management page.

#### Scenario: Owner opens the page with existing members and invites
- **WHEN** an authenticated `organization_owner` opens the member management page and the organization has active `member` users and pending invites in scope
- **THEN** the system shows only the members whose `organizationId` matches the owner
- **AND** the system shows only the pending invites visible to that owner

#### Scenario: Owner opens the page with no managed access records
- **WHEN** an authenticated `organization_owner` opens the member management page and no same-organization members or pending invites are available
- **THEN** the system renders an empty state that keeps the invite creation action available

### Requirement: Organization owners can create member invites from the page
The system MUST allow organization owners to create new member invites directly from the member management page.

#### Scenario: Owner creates a member invite successfully
- **WHEN** an authenticated `organization_owner` submits a valid invite e-mail from the member management page
- **THEN** the system creates a pending invite with role `member` for the owner's organization
- **AND** the page refreshes the visible access data and confirms that the invite was created

### Requirement: Organization owners can manage same-organization members from the page
The system MUST allow organization owners to perform the member actions already permitted by the backend from the member management page.

#### Scenario: Owner updates a visible member
- **WHEN** an authenticated `organization_owner` submits an allowed update for a visible same-organization `member`
- **THEN** the system persists the change through the user management workflow
- **AND** the page refreshes the visible members and confirms the update

#### Scenario: Owner removes a visible member
- **WHEN** an authenticated `organization_owner` confirms deletion for a visible same-organization `member`
- **THEN** the system removes that member through the user management workflow
- **AND** the page refreshes the visible members and confirms the removal