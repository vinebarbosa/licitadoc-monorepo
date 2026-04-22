# user-e2e-coverage Specification

## Purpose
TBD - created by archiving change add-user-management-e2e-tests. Update Purpose after archive.
## Requirements
### Requirement: User-management E2E coverage MUST verify scoped listing and reads over real HTTP
The system MUST include API end-to-end tests that call the real `/api/users/*` routes with authenticated sessions and verify that list and detail responses follow each actor's administrative visibility.

#### Scenario: Admin lists stored users across organizations
- **WHEN** an E2E test authenticates as an `admin` and requests the user list
- **THEN** the API returns a paginated list that includes stored users from multiple organizations and administrative roles within admin visibility

#### Scenario: Organization owner reads only users inside their organization scope
- **WHEN** an E2E test authenticates as an `organization_owner`, requests the user list, and reads an individual user
- **THEN** the list response includes only users from the actor's organization
- **AND** reading a user from another organization is rejected

### Requirement: User-management E2E coverage MUST verify persisted updates and deletion over real HTTP
The system MUST include API end-to-end tests that update and delete users through the real management routes while asserting the resulting stored user state.

#### Scenario: Admin updates a user's role or organization
- **WHEN** an E2E test authenticates as an `admin` and sends a valid update to a managed user
- **THEN** the API returns the updated user payload
- **AND** the stored user record reflects the requested role and organization changes

#### Scenario: Organization owner updates or deletes a member in the same organization
- **WHEN** an E2E test authenticates as an `organization_owner` and manages a `member` from the same organization
- **THEN** the allowed update is persisted
- **AND** deleting that member returns a successful deletion response and removes the user record

### Requirement: User-management E2E coverage MUST verify auth-dependent rejection paths
The system MUST include API end-to-end tests for failures that depend on authentication, actor role, or management scope.

#### Scenario: Unauthenticated or member actor cannot use user-management routes
- **WHEN** an E2E test calls user list, read, update, or delete routes without an authorized administrative session
- **THEN** the API rejects the request

#### Scenario: Organization owner cannot manage users outside allowed scope
- **WHEN** an E2E test authenticates as an `organization_owner` and attempts to update or delete a user from another organization or with a privileged role
- **THEN** the API rejects the request
- **AND** the target user's stored data remains unchanged

### Requirement: User-management E2E coverage MUST run in an isolated and repeatable environment
The system MUST provide deterministic setup and cleanup for user-management E2E scenarios so repeated local and CI runs do not depend on pre-existing user, organization, or auth state.

#### Scenario: User-management E2E scenarios start from clean fixture state
- **WHEN** the user-management E2E suite starts a scenario
- **THEN** it prepares or cleans the user, organization, and auth records needed for the fixture actors and managed users it exercises

