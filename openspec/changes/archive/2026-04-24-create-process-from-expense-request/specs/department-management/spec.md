## MODIFIED Requirements

### Requirement: Departments MUST be persisted as organization-bound prefeitura units
The system MUST persist departments as units that belong to exactly one organization and MUST expose their responsible authority fields and nullable `budgetUnitCode` through the department management contract.

#### Scenario: Reading department detail returns the prefeitura department profile
- **WHEN** an authorized actor requests a department by id
- **THEN** the system returns the stored department with `id`, `name`, `slug`, `organizationId`, nullable `budgetUnitCode`, `responsibleName`, `responsibleRole`, `createdAt`, and `updatedAt`

### Requirement: Department creation MUST respect actor organization scope
The system MUST create departments only inside a valid organization scope, MUST require responsible authority data, MUST require an organization-scoped department slug, and MUST allow an optional organization-scoped `budgetUnitCode`.

#### Scenario: Admin creates a department for any organization
- **WHEN** an authenticated `admin` submits valid department data including `organizationId`, `name`, `slug`, `responsibleName`, and `responsibleRole`
- **THEN** the system creates the department for the specified organization

#### Scenario: Organization owner creates a department in the owned organization
- **WHEN** an authenticated `organization_owner` with `organizationId` set submits valid department data
- **THEN** the system creates the department in the actor's own organization

#### Scenario: Department create request includes a budget unit code
- **WHEN** an authenticated administrative actor submits department creation data with a `budgetUnitCode` that is not used by another department in the same organization
- **THEN** the system stores the budget unit code on the created department

#### Scenario: Department create request omits responsible data
- **WHEN** an authenticated administrative actor submits department creation data without `responsibleName` or without `responsibleRole`
- **THEN** the system rejects the request

#### Scenario: Department create request reuses an existing slug in the same organization
- **WHEN** an authenticated administrative actor submits department creation data with a `slug` already used by another department in the same `organizationId`
- **THEN** the system rejects the request with a conflict response

#### Scenario: Department create request reuses an existing budget unit code in the same organization
- **WHEN** an authenticated administrative actor submits department creation data with a `budgetUnitCode` already used by another department in the same `organizationId`
- **THEN** the system rejects the request with a conflict response

### Requirement: Department updates MUST persist editable profile fields inside actor scope
The system MUST allow department updates only within the actor's management scope, MUST keep department organization ownership stable after creation, and MUST allow `budgetUnitCode` to be added, changed, or cleared within the same organization.

#### Scenario: Admin updates a department profile
- **WHEN** an authenticated `admin` updates a department's `name`, `slug`, `budgetUnitCode`, `responsibleName`, or `responsibleRole`
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

#### Scenario: Update reuses an existing budget unit code in the same organization
- **WHEN** an authenticated actor updates a department with a `budgetUnitCode` already used by another department in the same organization
- **THEN** the system rejects the request with a conflict response
