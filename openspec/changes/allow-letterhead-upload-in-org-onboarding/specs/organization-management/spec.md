## MODIFIED Requirements

### Requirement: Organization onboarding creates the prefeitura and links it to the current organization owner
The system MUST allow an authenticated `organization_owner` without organization to create an organization during onboarding, MUST link that actor to the created organization, and MUST allow the onboarding submission to include one optional valid print letterhead image that becomes the created organization's active letterhead.

#### Scenario: Organization owner without organization completes onboarding
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` submits valid prefeitura data to create an organization
- **THEN** the system creates the organization, stores `createdByUserId` with that actor, keeps the actor as `organization_owner`, and fills `users.organizationId` with the created organization id

#### Scenario: Organization owner completes onboarding with letterhead
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` submits valid prefeitura data with one valid PNG, JPEG, or WebP letterhead image
- **THEN** the system creates the organization, stores the image through the organization letterhead storage flow, marks it as the active letterhead for the created organization, links the owner to that organization, and returns the organization with its `letterhead` value populated

#### Scenario: Organization owner completes onboarding without letterhead
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` submits valid prefeitura data without a letterhead image
- **THEN** the system completes organization onboarding and returns the created organization with no active letterhead

#### Scenario: Onboarding letterhead upload is invalid
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` submits otherwise valid prefeitura data with no file content, multiple files, an unsupported MIME type, an empty file, or a file larger than the configured letterhead limit
- **THEN** the system rejects the request and does not complete organization onboarding

#### Scenario: Onboarding letterhead storage fails
- **WHEN** an authenticated `organization_owner` submits valid prefeitura data with a valid letterhead image but the image cannot be stored or associated
- **THEN** the system rejects the request and leaves the actor eligible to retry organization onboarding

#### Scenario: User with organization attempts onboarding again
- **WHEN** an authenticated actor whose `organizationId` is already set attempts to create an organization through onboarding
- **THEN** the system rejects the request

#### Scenario: Actor with a different role attempts to use the onboarding creation flow
- **WHEN** an authenticated `admin` or `member` attempts to create an organization through the onboarding route
- **THEN** the system rejects the request
