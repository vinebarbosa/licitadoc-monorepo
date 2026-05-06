## ADDED Requirements

### Requirement: Member invites MUST provision incomplete first-access users
The system SHALL provision invited `member` users in a first-access onboarding state when an `organization_owner` creates a member invite.

#### Scenario: Organization owner invites a new member
- **WHEN** an authenticated `organization_owner` creates an invite for an e-mail address that does not belong to an existing user
- **THEN** the system creates a `member` user linked to the inviter's organization
- **AND** the user has `onboardingStatus` equal to `pending_profile`
- **AND** the user has temporary-password metadata needed for first access
- **AND** the invite references the provisioned user

#### Scenario: Provisioned member receives temporary credentials
- **WHEN** the system sends the invite e-mail for a provisioned member invite
- **THEN** the e-mail includes the system sign-in link and the temporary password
- **AND** the e-mail does not require the member to accept the invite token before signing in

### Requirement: Provisioned member invites MUST reject token acceptance
The system SHALL prevent provisioned member invites from being consumed through the legacy token acceptance route.

#### Scenario: Provisioned member invite token is accepted
- **WHEN** an authenticated user attempts to accept an invite token for an invite that already references a provisioned `member` user
- **THEN** the system rejects the token acceptance request
- **AND** the invite and provisioned user remain unchanged
