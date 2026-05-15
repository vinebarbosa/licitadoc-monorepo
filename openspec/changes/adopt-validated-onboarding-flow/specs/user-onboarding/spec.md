## ADDED Requirements

### Requirement: Profile onboarding MUST update the current user and advance the next step by role
The system MUST allow an authenticated current user with `onboardingStatus` `pending_profile` to submit `name` and `password`, replace temporary credentials, and advance to the next onboarding state based on role.

#### Scenario: Organization owner completes profile onboarding
- **WHEN** an authenticated `organization_owner` with `onboardingStatus` `pending_profile` submits valid profile onboarding data
- **THEN** the system updates the stored user name and password
- **AND** the system clears temporary password metadata
- **AND** the response returns the user with `onboardingStatus` `pending_organization`

#### Scenario: Member completes profile onboarding
- **WHEN** an authenticated `member` with `onboardingStatus` `pending_profile` submits valid profile onboarding data
- **THEN** the system updates the stored user name and password
- **AND** the system clears temporary password metadata
- **AND** the response returns the user with `onboardingStatus` `complete`

### Requirement: Profile onboarding MUST reject unavailable or expired first-login attempts
The system MUST reject profile onboarding when the actor is no longer eligible to complete that step.

#### Scenario: User without pending profile onboarding attempts the route
- **WHEN** an authenticated user whose `onboardingStatus` is not `pending_profile` submits profile onboarding data
- **THEN** the system rejects the request

#### Scenario: Temporary password expired before onboarding completion
- **WHEN** an otherwise eligible user submits profile onboarding data after the temporary password has expired
- **THEN** the system rejects the request with an expiration error
