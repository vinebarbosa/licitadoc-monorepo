## ADDED Requirements

### Requirement: Invite E2E coverage MUST verify blocking member onboarding
The system SHALL include end-to-end coverage for provisioned member invitees signing in with temporary credentials and completing required first-access onboarding.

#### Scenario: Invited member completes first-access onboarding
- **WHEN** an E2E test authenticates as an `organization_owner`, creates a member invite, signs in as the invited member with the temporary password, and submits a valid onboarding name and new password
- **THEN** the member user is linked to the inviter's organization
- **AND** the member user transitions from `pending_profile` to `complete`
- **AND** the temporary-password metadata is cleared
- **AND** the invite is no longer consumable through token acceptance

#### Scenario: Pending member cannot bypass web onboarding
- **WHEN** a web test renders an authenticated app route for a `member` session with `onboardingStatus` equal to `pending_profile`
- **THEN** the blocking onboarding modal is visible
- **AND** attempts to dismiss it without submitting valid data leave the modal open
