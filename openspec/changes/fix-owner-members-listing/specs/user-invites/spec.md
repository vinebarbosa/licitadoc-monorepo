## ADDED Requirements

### Requirement: Member invite creation MUST expose provisioned user visibility
The system SHALL make provisioned member invitees visible through same-organization member listing after an organization owner creates a member invite.

#### Scenario: Organization owner creates a provisioned member invite
- **WHEN** an authenticated `organization_owner` creates a member invite that provisions a user
- **THEN** the provisioned user is linked to the owner's organization
- **AND** a subsequent same-organization member listing can include the provisioned user
- **AND** the invite response includes the invite e-mail and provisioned user reference needed by clients to refresh related views
