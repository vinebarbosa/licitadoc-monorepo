## MODIFIED Requirements

### Requirement: Organization onboarding creates the prefeitura and links it to the current organization owner
The system MUST allow an authenticated `organization_owner` without organization and with completed profile setup to create an organization during onboarding, and MUST link that actor to the created organization.

#### Scenario: Organization owner without organization completes onboarding
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` and whose onboarding status is `pending_organization` submits valid prefeitura data to create an organization
- **THEN** the system creates the organization, stores `createdByUserId` with that actor, keeps the actor as `organization_owner`, fills `users.organizationId` with the created organization id, and moves onboarding status to `complete`

#### Scenario: Organization onboarding refreshes current session context
- **WHEN** an invited owner completes organization onboarding
- **THEN** subsequent session reads for that user include the created `organizationId` and onboarding status `complete`

#### Scenario: User with organization attempts onboarding again
- **WHEN** an authenticated actor whose `organizationId` is already set attempts to create an organization through onboarding
- **THEN** the system rejects the request

#### Scenario: Actor with a different role attempts to use the onboarding creation flow
- **WHEN** an authenticated `admin` or `member` attempts to create an organization through the onboarding route
- **THEN** the system rejects the request

#### Scenario: Invited owner skips profile setup
- **WHEN** an authenticated `organization_owner` without organization but with onboarding status `pending_profile` attempts to create an organization
- **THEN** the system rejects the request until profile and password setup are complete
