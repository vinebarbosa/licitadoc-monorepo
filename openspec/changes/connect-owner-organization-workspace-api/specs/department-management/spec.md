## ADDED Requirements

### Requirement: Department deletion MUST be scoped to administrative visibility
The system MUST allow administrative actors to delete departments only within their management scope.

#### Scenario: Admin deletes a department
- **WHEN** an authenticated `admin` deletes a department
- **THEN** the system removes the department and returns a successful deletion response

#### Scenario: Organization owner deletes own organization department
- **WHEN** an authenticated `organization_owner` deletes a department whose `organizationId` matches the actor's organization
- **THEN** the system removes the department and returns a successful deletion response

#### Scenario: Organization owner deletes foreign department
- **WHEN** an authenticated `organization_owner` attempts to delete a department whose `organizationId` differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Member attempts to delete a department
- **WHEN** an authenticated `member` attempts to delete a department
- **THEN** the system rejects the request
