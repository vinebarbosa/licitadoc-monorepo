# process-e2e-coverage Specification

## Purpose
TBD - created by archiving change add-process-management-e2e-tests. Update Purpose after archive.
## Requirements
### Requirement: Process-management E2E coverage MUST verify process creation and persisted department links over real HTTP
The system MUST include API end-to-end tests that call the real `/api/processes/*` routes with authenticated sessions and verify process creation rules plus the resulting stored process state and department links.

#### Scenario: Admin creates a process for any organization
- **WHEN** an E2E test authenticates as an `admin` and sends a valid `POST /api/processes/` request with a target `organizationId` and same-organization `departmentIds`
- **THEN** the API returns the created process payload for that organization
- **AND** the stored process record persists the requested fields
- **AND** the stored `process_departments` links match the submitted department ids

#### Scenario: Organization-scoped actor creates a process only within the owned organization
- **WHEN** an E2E test authenticates as an `organization_owner` or `member` and sends a valid `POST /api/processes/` request for the actor's organization
- **THEN** the API creates the process inside that organization
- **AND** a request from that actor with a department id from another organization or with an organization outside the actor's scope is rejected

### Requirement: Process-management E2E coverage MUST verify scoped listings and detail reads over real HTTP
The system MUST include API end-to-end tests that verify paginated process listings and detail reads follow each actor's visibility rules, including member management visibility.

#### Scenario: Admin lists and reads processes across organizations
- **WHEN** an E2E test authenticates as an `admin` and requests process list and detail routes
- **THEN** the API returns stored processes across organizations within the paginated response
- **AND** detail reads return the persisted process profile with linked `departmentIds` for any target organization

#### Scenario: Organization owner and member receive organization-scoped visibility
- **WHEN** E2E tests authenticate as an `organization_owner` or `member` and request the process list
- **THEN** each list response includes only processes whose `organizationId` matches the actor's organization scope
- **AND** a non-admin actor without organization scope receives an empty paginated list
- **AND** an out-of-scope owner or member detail read is rejected

### Requirement: Process-management E2E coverage MUST verify persisted updates, department-link resynchronization, and preserved document ownership over real HTTP
The system MUST include API end-to-end tests that update processes through the real management routes while asserting stored field changes, synchronized join-table links, and preserved `documents.processId` ownership.

#### Scenario: Authorized actor updates a process within scope
- **WHEN** an E2E test authenticates as an `admin`, `organization_owner`, or `member` with permission over the target process and sends a valid `PATCH /api/processes/:processId` request
- **THEN** the API returns the updated process payload
- **AND** the stored process record reflects the requested field changes
- **AND** the stored `process_departments` links are replaced to match the submitted `departmentIds`

#### Scenario: Updating process data preserves existing document ownership
- **WHEN** an E2E test updates a process that already has a stored document linked through `documents.processId`
- **THEN** the related document remains attached to the same process id after the update completes

### Requirement: Process-management E2E coverage MUST verify auth-dependent rejection paths and same-organization conflicts
The system MUST include API end-to-end tests for failures that depend on authentication, actor role, organization scope, foreign department ids, or duplicate process numbers.

#### Scenario: Unauthenticated actor cannot access process-management routes
- **WHEN** an E2E test calls process creation, listing, detail, or update routes without an authorized session
- **THEN** the API rejects the request

#### Scenario: Out-of-scope actor or duplicate process number is rejected
- **WHEN** an E2E test authenticates as an `organization_owner` or `member` and attempts to read or update a process outside the actor's organization, or creates or updates a process with a `processNumber` already used in the same organization
- **THEN** the API rejects the request
- **AND** the target process's stored data and related links remain unchanged

### Requirement: Process-management E2E coverage MUST run in an isolated and repeatable environment
The system MUST provide deterministic setup and cleanup for process-management E2E scenarios so repeated local and CI runs do not depend on pre-existing auth, user, organization, department, process, join-table, or document state.

#### Scenario: Process-management E2E scenarios start from clean fixture state
- **WHEN** the process-management E2E suite starts a scenario
- **THEN** it prepares or cleans the auth, user, organization, department, process, process-department, and document records needed for the actors and stored processes it exercises

