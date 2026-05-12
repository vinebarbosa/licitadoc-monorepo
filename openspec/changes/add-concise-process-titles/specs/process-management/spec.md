## MODIFIED Requirements

### Requirement: Process records MUST expose the procurement process profile
The system MUST persist procurement processes as organization-bound records and MUST expose each stored process with `id`, `organizationId`, `type`, `processNumber`, nullable `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleName`, `status`, `departmentIds`, nullable `sourceKind`, nullable `sourceReference`, nullable `sourceMetadata`, `createdAt`, and `updatedAt`. The exposed `title` MUST be a concise non-empty display name, while `object` MUST remain the full procurement object text.

#### Scenario: Reading process detail returns the stored process profile
- **WHEN** an authorized actor requests a process by id
- **THEN** the system returns the persisted process with the full process profile, source metadata when present, linked `departmentIds`, a concise `title`, and the complete `object`

#### Scenario: Reading an older process derives a title fallback
- **WHEN** an authorized actor reads a process whose stored title is missing or blank
- **THEN** the system returns a concise derived `title` without mutating or shortening the stored `object`

### Requirement: Process creation MUST persist process data and department links within actor scope
The system MUST allow authenticated actors to create processes from persisted data or from normalized Solicitação de Despesa context and MUST enforce organization scope during creation. `admin` actors MUST be able to create a process for any organization. `organization_owner` and `member` actors MUST be able to create processes only for their own organization. Every created process MUST link to at least one department from the same organization. Every created process MUST store a concise non-empty `title`, using a submitted title when provided or deriving one from the submitted/source context when omitted.

#### Scenario: Admin creates a process for any organization
- **WHEN** an authenticated `admin` submits valid process data with an existing `organizationId` and department ids from that organization
- **THEN** the system creates the process, stores the process profile including a concise `title` and full `object`, persists the department links, and returns the created process

#### Scenario: Organization-scoped actor creates a process for the owned organization
- **WHEN** an authenticated `organization_owner` or `member` with `organizationId` set submits valid process data for that same organization
- **THEN** the system creates the process inside that organization, stores a concise `title` and full `object`, and returns the created process

#### Scenario: Organization-scoped actor creates a process from SD input
- **WHEN** an authenticated `organization_owner` or `member` submits valid Solicitação de Despesa input for the actor's organization and the input resolves to at least one department in that organization
- **THEN** the system creates the process inside that organization, stores a concise `title`, stores SD-derived source metadata, persists the department links, and returns the created process

#### Scenario: Creation derives title when omitted
- **WHEN** an authenticated actor creates a process without a `title` but with a long valid `object`
- **THEN** the system derives and stores a concise `title`
- **AND** the returned `object` remains the complete submitted object

#### Scenario: Creation uses a department from another organization
- **WHEN** an authenticated actor submits process data containing a department id that does not belong to the resolved process organization
- **THEN** the system rejects the request

#### Scenario: Creation conflicts with an existing process number in the same organization
- **WHEN** an authenticated actor creates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

### Requirement: Process updates MUST persist allowed fields and resynchronize department links
The system MUST allow authorized actors to update stored processes within their management scope. Updates MUST be able to change `type`, `processNumber`, `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleName`, `status`, and `departmentIds`. The system MUST replace process department links to match the submitted `departmentIds` set and MUST reject cross-organization department assignments.

#### Scenario: Authorized actor updates a stored process
- **WHEN** an authenticated actor with permission over the process submits valid changes
- **THEN** the system persists the allowed process fields, synchronizes the department links, updates `updatedAt`, and returns the updated process

#### Scenario: Update changes title independently from object
- **WHEN** an authenticated actor with permission over the process submits a new concise `title` without changing `object`
- **THEN** the system persists the new title and keeps the existing full object unchanged

#### Scenario: Update attempts to use a duplicate process number in the same organization
- **WHEN** an authenticated actor updates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Update attempts to move the process outside its organization scope
- **WHEN** an authenticated `organization_owner` or `member` attempts to update a process they cannot manage or submits department ids from another organization
- **THEN** the system rejects the request
