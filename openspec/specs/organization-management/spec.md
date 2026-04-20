## ADDED Requirements

### Requirement: Organization profiles represent a prefeitura with institutional data
The system MUST persist organization records as prefeitura profiles and MUST expose their institutional fields through the organization management contract.

#### Scenario: Reading organization detail returns institutional profile
- **WHEN** an authorized actor requests an organization by id
- **THEN** the system returns the stored organization with `name`, `slug`, `officialName`, `cnpj`, `city`, `state`, `address`, `zipCode`, `phone`, `institutionalEmail`, `website`, `logoUrl`, `authorityName`, `authorityRole`, `isActive`, `createdByUserId`, `createdAt` and `updatedAt`

### Requirement: Organization onboarding creates the prefeitura and links it to the current organization owner
The system MUST allow an authenticated `organization_owner` without organization to create an organization during onboarding, and MUST link that actor to the created organization.

#### Scenario: Organization owner without organization completes onboarding
- **WHEN** an authenticated `organization_owner` whose `organizationId` is `null` submits valid prefeitura data to create an organization
- **THEN** the system creates the organization, stores `createdByUserId` with that actor, keeps the actor as `organization_owner`, and fills `users.organizationId` with the created organization id

#### Scenario: User with organization attempts onboarding again
- **WHEN** an authenticated actor whose `organizationId` is already set attempts to create an organization through onboarding
- **THEN** the system rejects the request

#### Scenario: Actor with a different role attempts to use the onboarding creation flow
- **WHEN** an authenticated `admin` or `member` attempts to create an organization through the onboarding route
- **THEN** the system rejects the request

### Requirement: Organization listings are backed by stored organizations and respect actor scope
The system MUST return paginated organization listings from persisted `organizations` data and MUST scope those listings according to the authenticated actor's administrative permissions.

#### Scenario: Admin lists all organizations
- **WHEN** an authenticated `admin` requests the organization listing
- **THEN** the system returns a paginated list of stored organizations

#### Scenario: Organization owner lists only the owned organization
- **WHEN** an authenticated `organization_owner` requests the organization listing
- **THEN** the system returns only the organization whose `id` matches the actor's `organizationId`

### Requirement: Organization detail reads are scoped by visibility
The system MUST allow only actors with visibility over a target organization to read that organization's detail.

#### Scenario: Admin reads any organization
- **WHEN** an authenticated `admin` requests an organization by id
- **THEN** the system returns the persisted detail for that organization

#### Scenario: Organization owner reads another organization
- **WHEN** an authenticated `organization_owner` requests an organization whose `id` differs from the actor's `organizationId`
- **THEN** the system rejects the request

### Requirement: Organization updates persist allowed fields and enforce role-based restrictions
The system MUST allow organization updates only within the actor's management scope and MUST enforce field-level restrictions for governance fields.

#### Scenario: Admin updates any allowed organization field
- **WHEN** an authenticated `admin` updates an organization's management fields, including `isActive`
- **THEN** the system persists the updated organization data and returns the updated organization

#### Scenario: Organization owner updates the owned prefeitura profile
- **WHEN** an authenticated `organization_owner` updates the organization whose `id` matches the actor's `organizationId` using allowed institutional fields
- **THEN** the system persists the update and returns the updated organization

#### Scenario: Organization owner attempts to change an admin-only field
- **WHEN** an authenticated `organization_owner` attempts to change `isActive` or `createdByUserId`
- **THEN** the system rejects the request

#### Scenario: Update conflicts with an existing slug or cnpj
- **WHEN** an authenticated actor updates an organization with a `slug` or `cnpj` already used by another organization
- **THEN** the system rejects the request with a conflict response
