# process-management Specification

## Purpose
Defines persisted procurement process management, including organization scoping, department links, process profile fields, source traceability, document ownership, listings, reads, and updates.

## Requirements

### Requirement: Process records MUST expose the procurement process profile
The system MUST persist procurement processes as organization-bound records and MUST expose each stored process with `id`, `organizationId`, `type`, `processNumber`, nullable `externalId`, `issuedAt`, `object`, `justification`, `responsibleName`, `status`, `departmentIds`, nullable `sourceKind`, nullable `sourceReference`, nullable `sourceMetadata`, `createdAt`, and `updatedAt`.

#### Scenario: Reading process detail returns the stored process profile
- **WHEN** an authorized actor requests a process by id
- **THEN** the system returns the persisted process with the full process profile, source metadata when present, and linked `departmentIds`

### Requirement: Process creation MUST persist process data and department links within actor scope
The system MUST allow authenticated actors to create processes from persisted data or from normalized Solicitação de Despesa context and MUST enforce organization scope during creation. `admin` actors MUST be able to create a process for any organization. `organization_owner` and `member` actors MUST be able to create processes only for their own organization. Every created process MUST link to at least one department from the same organization.

#### Scenario: Admin creates a process for any organization
- **WHEN** an authenticated `admin` submits valid process data with an existing `organizationId` and department ids from that organization
- **THEN** the system creates the process, stores the process profile, persists the department links, and returns the created process

#### Scenario: Organization-scoped actor creates a process for the owned organization
- **WHEN** an authenticated `organization_owner` or `member` with `organizationId` set submits valid process data for that same organization
- **THEN** the system creates the process inside that organization and returns the created process

#### Scenario: Organization-scoped actor creates a process from SD input
- **WHEN** an authenticated `organization_owner` or `member` submits valid Solicitação de Despesa input for the actor's organization and the input resolves to at least one department in that organization
- **THEN** the system creates the process inside that organization, stores SD-derived source metadata, persists the department links, and returns the created process

#### Scenario: Creation uses a department from another organization
- **WHEN** an authenticated actor submits process data containing a department id that does not belong to the resolved process organization
- **THEN** the system rejects the request

#### Scenario: Creation conflicts with an existing process number in the same organization
- **WHEN** an authenticated actor creates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

### Requirement: Processes imported from source files MUST preserve source-file traceability
The system MUST allow a stored process created from an imported source file to persist `sourceKind`, `sourceReference`, and structured `sourceMetadata` describing the imported file and intake warnings. That structured metadata MUST be readable with the process without exposing raw file bytes in process responses.

#### Scenario: Imported process detail includes source-file metadata
- **WHEN** an authorized actor reads a process that was created from an uploaded source PDF
- **THEN** the system returns the process profile together with source traceability metadata such as file name, content type, storage location, and intake warnings

#### Scenario: Directly created process omits source-file metadata
- **WHEN** an authorized actor reads a process that was created without an imported source file
- **THEN** the system may keep `sourceKind`, `sourceReference`, and `sourceMetadata` null without changing the rest of the process profile

### Requirement: Processes MUST preserve one-to-many document ownership
The system MUST preserve the existing ownership model in which one process can have many related documents and each document belongs to exactly one process through `documents.processId`. Process reads and updates MUST NOT break existing document links for that process.

#### Scenario: Multiple documents belong to the same process
- **WHEN** two or more stored documents reference the same `processId`
- **THEN** the system treats them as documents of that single process

#### Scenario: One document cannot belong to multiple processes
- **WHEN** a stored document is linked to a process through `processId`
- **THEN** that document belongs to exactly one process at a time

#### Scenario: Updating process data preserves related document links
- **WHEN** an authorized actor updates process fields or department links for a process that already has documents
- **THEN** the related documents remain linked to that same process id

### Requirement: Process listings MUST be paginated and scoped by actor visibility
The system MUST return paginated process listings from persisted data and MUST scope those listings according to the authenticated actor's permissions. `admin` actors MUST be able to list processes across organizations. `organization_owner` and `member` actors MUST be able to list only processes whose `organizationId` matches the actor's `organizationId`. Non-admin actors without an `organizationId` MUST receive an empty paginated response.

#### Scenario: Admin lists all processes
- **WHEN** an authenticated `admin` requests the process listing
- **THEN** the system returns a paginated list of stored processes across organizations

#### Scenario: Organization-scoped actor lists only own organization processes
- **WHEN** an authenticated `organization_owner` or `member` requests the process listing
- **THEN** the system returns only processes whose `organizationId` matches the actor's `organizationId`

#### Scenario: Non-admin actor without organization scope receives an empty page
- **WHEN** an authenticated non-admin actor without `organizationId` requests the process listing
- **THEN** the system returns an empty paginated response

### Requirement: Process detail reads MUST be limited by organization visibility
The system MUST allow only actors with visibility over a target process organization to read that process.

#### Scenario: Admin reads any process
- **WHEN** an authenticated `admin` requests a stored process by id
- **THEN** the system returns the persisted process detail

#### Scenario: Organization-scoped actor reads a process from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a process whose `organizationId` differs from the actor's `organizationId`
- **THEN** the system rejects the request

### Requirement: Process updates MUST persist allowed fields and resynchronize department links
The system MUST allow authorized actors to update stored processes within their management scope. Updates MUST be able to change `type`, `processNumber`, `externalId`, `issuedAt`, `object`, `justification`, `responsibleName`, `status`, and `departmentIds`. The system MUST replace process department links to match the submitted `departmentIds` set and MUST reject cross-organization department assignments.

#### Scenario: Authorized actor updates a stored process
- **WHEN** an authenticated actor with permission over the process submits valid changes
- **THEN** the system persists the allowed process fields, synchronizes the department links, updates `updatedAt`, and returns the updated process

#### Scenario: Update attempts to use a duplicate process number in the same organization
- **WHEN** an authenticated actor updates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Update attempts to move the process outside its organization scope
- **WHEN** an authenticated `organization_owner` or `member` attempts to update a process they cannot manage or submits department ids from another organization
- **THEN** the system rejects the request
