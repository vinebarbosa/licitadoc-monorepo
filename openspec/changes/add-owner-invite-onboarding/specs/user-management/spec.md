## ADDED Requirements

### Requirement: Users expose onboarding status
The system MUST expose the onboarding status needed to determine whether a user can enter the main app or must complete invited owner setup.

#### Scenario: Session includes owner onboarding status
- **WHEN** an invited `organization_owner` signs in with a valid temporary password
- **THEN** the authenticated session includes the user's role, `organizationId`, and onboarding status

#### Scenario: Admin reads invited user status
- **WHEN** an authenticated `admin` lists or reads users
- **THEN** the response includes each user's onboarding status so the admin can distinguish pending profile, pending organization, and complete users

### Requirement: Invited owners must complete profile and password setup
The system MUST allow an authenticated invited `organization_owner` with onboarding status `pending_profile` to set their real name and replace the temporary password before organization onboarding.

#### Scenario: Invited owner completes profile setup
- **WHEN** an invited `organization_owner` authenticated with a temporary password submits a valid name and new password
- **THEN** the system updates the user's name, replaces the temporary password with the new password credential, clears temporary-password requirements, and moves onboarding status to `pending_organization`

#### Scenario: Invited owner attempts organization setup before profile setup
- **WHEN** an invited `organization_owner` whose onboarding status is `pending_profile` attempts to create an organization
- **THEN** the system rejects the request and requires profile and password setup first

#### Scenario: Completed user attempts profile onboarding again
- **WHEN** a user whose onboarding status is `pending_organization` or `complete` attempts to submit the profile setup step again
- **THEN** the system rejects the request and does not change the user's credential
