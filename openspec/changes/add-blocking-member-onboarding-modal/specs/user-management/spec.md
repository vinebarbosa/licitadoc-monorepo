## ADDED Requirements

### Requirement: Invited members MUST complete current-user profile onboarding
The system SHALL allow an authenticated invited `member` in `pending_profile` to complete first-access onboarding by setting their name and replacing their temporary password.

#### Scenario: Pending member completes onboarding
- **WHEN** an authenticated `member` with `onboardingStatus` equal to `pending_profile` submits a valid name and new password to the current-user onboarding endpoint
- **THEN** the system updates the user's name
- **AND** the system replaces the credential password
- **AND** the system clears temporary-password metadata
- **AND** the system changes `onboardingStatus` to `complete`
- **AND** the response includes the updated session-visible user state

#### Scenario: Complete member attempts onboarding again
- **WHEN** an authenticated `member` with `onboardingStatus` equal to `complete` submits the current-user onboarding endpoint
- **THEN** the system rejects the request
- **AND** the user's stored profile, password, and onboarding status remain unchanged

### Requirement: User onboarding consistency MUST allow pending invited members
The system SHALL persist onboarding state consistently for invited members and completed users.

#### Scenario: Pending member has temporary-password metadata
- **WHEN** the system persists an invited `member` with `onboardingStatus` equal to `pending_profile`
- **THEN** the database accepts the row only when the user has temporary-password metadata needed for first access

#### Scenario: Complete member has no temporary-password metadata
- **WHEN** the system persists a `member` with `onboardingStatus` equal to `complete`
- **THEN** the database requires temporary-password expiration metadata to be cleared
