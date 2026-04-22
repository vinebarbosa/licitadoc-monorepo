## ADDED Requirements

### Requirement: Department-management E2E coverage MUST verify department creation and persisted scope over real HTTP
The system MUST include API end-to-end tests that call the real `/api/departments/*` routes with authenticated sessions and verify department creation rules plus the resulting stored department state.

#### Scenario: Admin creates a department for any organization
- **WHEN** an E2E test authenticates as an `admin` and sends a valid `POST /api/departments/` request with a target `organizationId`
- **THEN** the API returns the created department payload for that organization
- **AND** the stored department record persists the canonical slug and responsible authority fields

#### Scenario: Organization owner creates a department only in the owned organization
- **WHEN** an E2E test authenticates as an `organization_owner` and sends a valid `POST /api/departments/` request for the owned organization
- **THEN** the API creates the department inside the actor's organization
- **AND** an attempt from that actor to create a department outside the owned organization or without organization scope is rejected

### Requirement: Department-management E2E coverage MUST verify scoped listings and detail reads over real HTTP
The system MUST include API end-to-end tests that verify paginated department listings and detail reads follow each actor's visibility rules, including member list-only behavior.

#### Scenario: Admin lists and reads departments across organizations
- **WHEN** an E2E test authenticates as an `admin` and requests department list and detail routes
- **THEN** the API returns stored departments across organizations within the paginated response
- **AND** detail reads return the persisted department profile for any target organization

#### Scenario: Organization owner and member receive organization-scoped visibility
- **WHEN** E2E tests authenticate as an `organization_owner` or `member` and request the department list
- **THEN** each list response includes only departments whose `organizationId` matches the actor's organization scope
- **AND** a `member` without organization scope receives an empty paginated list
- **AND** an out-of-scope owner detail read or any member detail read is rejected

### Requirement: Department-management E2E coverage MUST verify persisted updates and same-organization conflicts over real HTTP
The system MUST include API end-to-end tests that update departments through the real management routes while asserting persisted results and conflict handling for same-organization slug reuse.

#### Scenario: Admin or organization owner updates a department profile within scope
- **WHEN** an E2E test authenticates as an `admin` or same-organization `organization_owner` and sends a valid `PATCH /api/departments/:departmentId` request
- **THEN** the API returns the updated department payload
- **AND** the stored department record reflects the requested name, slug, or responsible authority changes

#### Scenario: Same-organization slug reuse is rejected for create or update
- **WHEN** an E2E test creates or updates a department with a slug already used by another department in the same organization
- **THEN** the API rejects the request with a conflict response
- **AND** the existing department records remain unchanged

### Requirement: Department-management E2E coverage MUST verify auth-dependent rejection paths
The system MUST include API end-to-end tests for failures that depend on authentication, actor role, or organization scope.

#### Scenario: Unauthenticated or member actor cannot create or update departments
- **WHEN** an E2E test calls department creation or update routes without an authorized administrative session
- **THEN** the API rejects the request

#### Scenario: Out-of-scope actor cannot read or update departments
- **WHEN** an E2E test authenticates as an `organization_owner` and attempts to read or update a department from another organization
- **THEN** the API rejects the request
- **AND** the target department's stored data remains unchanged

### Requirement: Department-management E2E coverage MUST run in an isolated and repeatable environment
The system MUST provide deterministic setup and cleanup for department-management E2E scenarios so repeated local and CI runs do not depend on pre-existing auth, user, organization, or department state.

#### Scenario: Department-management E2E scenarios start from clean fixture state
- **WHEN** the department-management E2E suite starts a scenario
- **THEN** it prepares or cleans the auth, user, organization, and department records needed for the actors and stored departments it exercises
