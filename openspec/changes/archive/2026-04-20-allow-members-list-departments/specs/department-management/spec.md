## MODIFIED Requirements

### Requirement: Department listings MUST be paginated and scoped by actor visibility
The system MUST return paginated department listings from persisted data and MUST scope those listings according to the authenticated actor's permissions. `admin` actors MUST be able to list departments across organizations. `organization_owner` and `member` actors MUST be able to list only departments whose `organizationId` matches the actor's `organizationId`. Non-admin actors without an `organizationId` MUST receive an empty paginated response.

#### Scenario: Admin lists all departments
- **WHEN** an authenticated `admin` requests the department listing
- **THEN** the system returns a paginated list of stored departments across organizations

#### Scenario: Organization owner lists only departments from the owned organization
- **WHEN** an authenticated `organization_owner` requests the department listing
- **THEN** the system returns only departments whose `organizationId` matches the actor's `organizationId`

#### Scenario: Member lists only departments from the member organization
- **WHEN** an authenticated `member` with `organizationId` set requests the department listing
- **THEN** the system returns only departments whose `organizationId` matches the actor's `organizationId`

#### Scenario: Non-admin actor without organization scope receives an empty page
- **WHEN** an authenticated non-admin actor without `organizationId` requests the department listing
- **THEN** the system returns an empty paginated response
