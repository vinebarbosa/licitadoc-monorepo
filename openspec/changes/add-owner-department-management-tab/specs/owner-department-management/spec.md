## ADDED Requirements

### Requirement: Organization owners can access department administration from the owner page
The system MUST expose department administration as a tab inside the owner-only organization administration page.

#### Scenario: Organization owner opens the owner administration page
- **WHEN** an authenticated `organization_owner` with completed onboarding navigates to `/app/membros`
- **THEN** the system renders the owner administration page inside the authenticated app shell
- **AND** the page exposes tabs for member administration and department administration

#### Scenario: Non-owner user attempts to open the owner administration page
- **WHEN** an authenticated user whose role is not `organization_owner` navigates to `/app/membros`
- **THEN** the system redirects that user to the unauthorized page

### Requirement: Department tab shows owner-scoped departments
The system MUST load and show departments visible to the current organization owner through the existing department listing contract.

#### Scenario: Owner opens the department tab with existing departments
- **WHEN** an authenticated `organization_owner` opens the department tab and departments exist in the owned organization
- **THEN** the system shows those departments with name, optional budget unit code, responsible name, and responsible role

#### Scenario: Owner opens the department tab with no departments
- **WHEN** an authenticated `organization_owner` opens the department tab and no departments are available in the owned organization
- **THEN** the system renders an empty state that keeps the department creation action available

#### Scenario: Department list fails to load
- **WHEN** an authenticated `organization_owner` opens the department tab and the department listing request fails
- **THEN** the system shows an error state with a retry action

### Requirement: Organization owners can create departments from the department tab
The system MUST allow organization owners to create departments from the department tab using the existing department creation contract.

#### Scenario: Owner creates a department successfully
- **WHEN** an authenticated `organization_owner` submits valid department data with name, slug, responsible name, responsible role, and optional budget unit code
- **THEN** the system creates the department in the owner's organization
- **AND** the department tab refreshes the visible department list and confirms that the department was created

#### Scenario: Owner submits incomplete department data
- **WHEN** an authenticated `organization_owner` attempts to submit department creation without required department data
- **THEN** the system prevents submission or shows validation feedback for the missing required fields

#### Scenario: Department creation is rejected by the API
- **WHEN** an authenticated `organization_owner` submits department data that the API rejects
- **THEN** the system shows the rejection message when available
- **AND** the creation form remains available for correction

### Requirement: Member administration behavior remains available
The system MUST preserve the current owner member administration workflow when adding the department tab.

#### Scenario: Owner opens the members tab
- **WHEN** an authenticated `organization_owner` opens the owner administration page
- **THEN** the system keeps the member administration tab available as the default workflow
- **AND** existing member list, invite, update, and remove actions remain available according to the existing owner member management behavior
