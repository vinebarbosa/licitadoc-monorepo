## ADDED Requirements

### Requirement: Departments MUST be persisted as organization-bound prefeitura units
The system MUST persist departments as units that belong to exactly one organization and MUST expose their responsible authority fields through the department management contract.

#### Scenario: Reading department detail returns the prefeitura department profile
- **WHEN** an authorized actor requests a department by id
- **THEN** the system returns the stored department with `id`, `name`, `slug`, `organizationId`, `responsibleName`, `responsibleRole`, `createdAt`, and `updatedAt`

### Requirement: Only administrative actors MUST manage departments
The system MUST allow only `admin` and `organization_owner` actors to create and update departments, and MUST reject department management actions from `member` users.

#### Scenario: Member attempts to create a department
- **WHEN** an authenticated `member` attempts to create a department
- **THEN** the system rejects the request

#### Scenario: Member attempts to update a department
- **WHEN** an authenticated `member` attempts to update a department
- **THEN** the system rejects the request

### Requirement: Department creation MUST respect actor organization scope
The system MUST create departments only inside a valid organization scope, MUST require responsible authority data, and MUST require an organization-scoped department slug.

#### Scenario: Admin creates a department for any organization
- **WHEN** an authenticated `admin` submits valid department data including `organizationId`, `name`, `slug`, `responsibleName`, and `responsibleRole`
- **THEN** the system creates the department for the specified organization

#### Scenario: Organization owner creates a department in the owned organization
- **WHEN** an authenticated `organization_owner` with `organizationId` set submits valid department data
- **THEN** the system creates the department in the actor's own organization

#### Scenario: Department create request omits responsible data
- **WHEN** an authenticated administrative actor submits department creation data without `responsibleName` or without `responsibleRole`
- **THEN** the system rejects the request

#### Scenario: Department create request reuses an existing slug in the same organization
- **WHEN** an authenticated administrative actor submits department creation data with a `slug` already used by another department in the same `organizationId`
- **THEN** the system rejects the request with a conflict response

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

### Requirement: Department detail reads MUST be scoped to the actor's administrative visibility
The system MUST allow department detail reads only for actors that have visibility over the target department's organization.

#### Scenario: Admin reads any department
- **WHEN** an authenticated `admin` requests a department by id
- **THEN** the system returns the persisted detail for that department

#### Scenario: Organization owner reads department from another organization
- **WHEN** an authenticated `organization_owner` requests a department whose `organizationId` differs from the actor's `organizationId`
- **THEN** the system rejects the request

### Requirement: Department updates MUST persist editable profile fields inside actor scope
The system MUST allow department updates only within the actor's management scope and MUST keep department organization ownership stable after creation.

#### Scenario: Admin updates a department profile
- **WHEN** an authenticated `admin` updates a department's `name`, `slug`, `responsibleName`, or `responsibleRole`
- **THEN** the system persists the updated department data and returns the updated department

#### Scenario: Organization owner updates a department from the owned organization
- **WHEN** an authenticated `organization_owner` updates a department whose `organizationId` matches the actor's `organizationId`
- **THEN** the system persists the updated department data and returns the updated department

#### Scenario: Update attempts to move a department to another organization
- **WHEN** an authenticated actor attempts to update a department's `organizationId`
- **THEN** the system rejects the request

#### Scenario: Update reuses an existing slug in the same organization
- **WHEN** an authenticated actor updates a department with a `slug` already used by another department in the same organization
- **THEN** the system rejects the request with a conflict response
