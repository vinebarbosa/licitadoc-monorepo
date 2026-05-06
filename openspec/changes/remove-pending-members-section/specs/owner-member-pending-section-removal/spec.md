## ADDED Requirements

### Requirement: Owner member administration MUST NOT show a standalone pending section
The system MUST render the owner organization administration Members tab without a standalone pending members or pending invites section.

#### Scenario: Owner opens members tab with pending invites available
- **WHEN** an authenticated `organization_owner` opens the Members tab and pending invites exist for the organization
- **THEN** the system does not render a standalone pending members or pending invites section
- **AND** the system keeps the member invite creation action available

#### Scenario: Owner opens members tab with pending-profile members
- **WHEN** an authenticated `organization_owner` opens the Members tab and the users API returns same-organization `member` users with pending onboarding status
- **THEN** the system renders those users in the members table
- **AND** the system does not render a separate pending section for them

### Requirement: Member invite creation MUST remain available after removing the pending section
The system MUST preserve the owner member invite creation workflow after removing the standalone pending section.

#### Scenario: Owner creates a member invite
- **WHEN** an authenticated `organization_owner` submits a valid invite e-mail from the Members tab
- **THEN** the system creates the member invite through the existing invite workflow
- **AND** the visible members list refreshes according to the existing member administration behavior
- **AND** the page does not show a pending invites section after the invite is created
