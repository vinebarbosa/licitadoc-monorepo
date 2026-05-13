## ADDED Requirements

### Requirement: Process items MUST be stored as canonical structured data
The system MUST persist process items as structured data linked to the parent process instead of requiring callers or document-generation code to read items from generic source metadata. A process item MUST be either `simple` or `kit`. Simple items MAY include an item-level `description`. Kit items MUST NOT require an item-level `description` and MUST support components with their own `description`.

#### Scenario: Simple item is persisted with description
- **WHEN** an authorized actor creates a process with a `simple` item containing `code`, `title`, `description`, `quantity`, `unit`, `unitValue`, and `totalValue`
- **THEN** the system stores that item as a structured child of the created process

#### Scenario: Kit item is persisted without item description
- **WHEN** an authorized actor creates a process with a `kit` item containing `code`, `title`, `quantity`, `unit`, `unitValue`, `totalValue`, and components
- **THEN** the system stores the kit item without requiring an item-level `description`

#### Scenario: Kit components keep their own descriptions
- **WHEN** a kit item contains components with `title`, `description`, `quantity`, and `unit`
- **THEN** the system stores each component as structured data linked to that kit item

#### Scenario: Derived item summary is computed by the API
- **WHEN** an authorized actor reads a process with structured items
- **THEN** the system may return item count, component count, and estimated total value computed from stored item data

## MODIFIED Requirements

### Requirement: Process records MUST expose the procurement process profile
The system MUST persist procurement processes as organization-bound records and MUST expose each stored process with `id`, `organizationId`, nullable `procurementMethod`, nullable `biddingModality`, `processNumber`, nullable `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleUserId`, `status`, `departmentIds`, structured `items`, `createdAt`, and `updatedAt`. The native process profile MUST NOT require or expose `type`, `responsibleName`, `sourceKind`, `sourceReference`, or generic `sourceMetadata`.

#### Scenario: Reading process detail returns the stored process profile
- **WHEN** an authorized actor requests a process by id
- **THEN** the system returns the persisted process with the full canonical process profile, linked `departmentIds`, structured `items`, document cards, and API-computed summary values when available

### Requirement: Process creation MUST persist process data and department links within actor scope
The system MUST allow authenticated actors to create processes from the canonical English process payload and MUST enforce organization scope during creation. `admin` actors MUST be able to create a process for any organization. `organization_owner` and `member` actors MUST be able to create processes only for their own organization. Every created process MUST link to at least one department from the same organization. The system MUST validate `responsibleUserId` against the resolved process organization and MUST persist structured items when submitted.

#### Scenario: Admin creates a process for any organization
- **WHEN** an authenticated `admin` submits valid canonical process data with an existing `organizationId`, a responsible user, and department ids from that organization
- **THEN** the system creates the process, stores the canonical process profile, persists the department links, persists any structured items, and returns the created process

#### Scenario: Organization-scoped actor creates a process for the owned organization
- **WHEN** an authenticated `organization_owner` or `member` with `organizationId` set submits valid canonical process data for that same organization
- **THEN** the system creates the process inside that organization and returns the created process

#### Scenario: Creation uses a responsible user from another organization
- **WHEN** an authenticated actor submits process data containing a `responsibleUserId` that does not belong to the resolved process organization
- **THEN** the system rejects the request

#### Scenario: Creation uses a department from another organization
- **WHEN** an authenticated actor submits process data containing a department id that does not belong to the resolved process organization
- **THEN** the system rejects the request

#### Scenario: Creation conflicts with an existing process number in the same organization
- **WHEN** an authenticated actor creates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

### Requirement: Processes MUST preserve one-to-many document ownership
The system MUST preserve the existing ownership model in which one process can have many related documents and each document belongs to exactly one process through `documents.processId`. Process profile migrations, item changes, reads, and updates MUST NOT break existing document links for that process.

#### Scenario: Multiple documents belong to the same process
- **WHEN** two or more stored documents reference the same `processId`
- **THEN** the system treats them as documents of that single process

#### Scenario: One document cannot belong to multiple processes
- **WHEN** a stored document is linked to a process through `processId`
- **THEN** that document belongs to exactly one process at a time

#### Scenario: Updating process data preserves related document links
- **WHEN** an authorized actor updates process fields, structured items, or department links for a process that already has documents
- **THEN** the related documents remain linked to that same process id

### Requirement: Process updates MUST persist allowed fields and resynchronize department links
The system MUST allow authorized actors to update stored processes within their management scope. Updates MUST be able to change `procurementMethod`, `biddingModality`, `processNumber`, `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleUserId`, `status`, `departmentIds`, and structured `items`. The system MUST replace process department links to match the submitted `departmentIds` set when provided, MUST replace structured items to match submitted `items` when provided, and MUST reject cross-organization department or responsible-user assignments.

#### Scenario: Authorized actor updates a stored process
- **WHEN** an authenticated actor with permission over the process submits valid canonical changes
- **THEN** the system persists the allowed process fields, synchronizes submitted department links and items, updates `updatedAt`, and returns the updated process

#### Scenario: Update attempts to use a duplicate process number in the same organization
- **WHEN** an authenticated actor updates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Update attempts to move the process outside its organization scope
- **WHEN** an authenticated `organization_owner` or `member` attempts to update a process they cannot manage or submits department ids from another organization
- **THEN** the system rejects the request

#### Scenario: Update attempts to use a responsible user from another organization
- **WHEN** an authenticated actor updates a process with a `responsibleUserId` that does not belong to the process organization
- **THEN** the system rejects the request

## REMOVED Requirements

### Requirement: Processes imported from source files MUST preserve source-file traceability
**Reason**: The canonical process model replaces public generic `sourceKind`, `sourceReference`, and `sourceMetadata` fields with explicit process fields and structured items. Native process consumers should not depend on arbitrary metadata to understand a process.

**Migration**: Map known SD/PDF extracted fields and item metadata into canonical process fields and structured process items during migration or intake. If file-level traceability is still needed internally, keep it outside the public process profile and do not require native process create/update callers to submit it.
