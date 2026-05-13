## MODIFIED Requirements

### Requirement: Process records MUST expose the procurement process profile
The system MUST persist procurement processes as organization-bound records and MUST expose each stored process with `id`, `organizationId`, nullable `procurementMethod`, nullable `biddingModality`, `processNumber`, nullable `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleName`, `status`, `departmentIds`, structured `items`, `createdAt`, and `updatedAt`. The native process profile MUST NOT require or expose `type`, `responsibleUserId`, `sourceKind`, `sourceReference`, or generic `sourceMetadata`.

#### Scenario: Reading process detail returns the stored process profile
- **WHEN** an authorized actor requests a process by id
- **THEN** the system returns the persisted process with the full canonical process profile, linked `departmentIds`, structured `items`, document cards, and API-computed summary values when available

#### Scenario: Reading process detail exposes free-text responsible
- **WHEN** an authorized actor reads a process with a persisted responsible name
- **THEN** the response includes `responsibleName` as the stored string and does not require the caller to resolve an application user

### Requirement: Process creation MUST persist process data and department links within actor scope
The system MUST allow authenticated actors to create processes from the canonical English process payload and MUST enforce organization scope during creation. `admin` actors MUST be able to create a process for any organization. `organization_owner` and `member` actors MUST be able to create processes only for their own organization. Every created process MUST link to at least one department from the same organization. The system MUST persist `responsibleName` as a required trimmed string and MUST persist structured items when submitted.

#### Scenario: Admin creates a process for any organization
- **WHEN** an authenticated `admin` submits valid canonical process data with an existing `organizationId`, a responsible name, and department ids from that organization
- **THEN** the system creates the process, stores the canonical process profile, persists the department links, persists any structured items, and returns the created process

#### Scenario: Organization-scoped actor creates a process for the owned organization
- **WHEN** an authenticated `organization_owner` or `member` with `organizationId` set submits valid canonical process data for that same organization with a responsible name
- **THEN** the system creates the process inside that organization and returns the created process

#### Scenario: Creation uses a responsible name that is not an application user
- **WHEN** an authenticated actor submits process data containing a `responsibleName` that does not match an application user
- **THEN** the system accepts the responsible name string without performing user lookup or user-organization validation

#### Scenario: Creation uses a department from another organization
- **WHEN** an authenticated actor submits process data containing a department id that does not belong to the resolved process organization
- **THEN** the system rejects the request

#### Scenario: Creation conflicts with an existing process number in the same organization
- **WHEN** an authenticated actor creates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

### Requirement: Process updates MUST persist allowed fields and resynchronize department links
The system MUST allow authorized actors to update stored processes within their management scope. Updates MUST be able to change `procurementMethod`, `biddingModality`, `processNumber`, `externalId`, `issuedAt`, `title`, `object`, `justification`, `responsibleName`, `status`, `departmentIds`, and structured `items`. The system MUST replace process department links to match the submitted `departmentIds` set when provided, MUST replace structured items to match submitted `items` when provided, and MUST reject cross-organization department assignments.

#### Scenario: Authorized actor updates a stored process
- **WHEN** an authenticated actor with permission over the process submits valid canonical changes
- **THEN** the system persists the allowed process fields, synchronizes submitted department links and items, updates `updatedAt`, and returns the updated process

#### Scenario: Update changes responsible name to free text
- **WHEN** an authenticated actor updates a process with a new `responsibleName`
- **THEN** the system stores the submitted responsible name string without requiring it to match an application user

#### Scenario: Update attempts to use a duplicate process number in the same organization
- **WHEN** an authenticated actor updates a process with a `processNumber` already used by another process in the same organization
- **THEN** the system rejects the request with a conflict response

#### Scenario: Update attempts to move the process outside its organization scope
- **WHEN** an authenticated `organization_owner` or `member` attempts to update a process they cannot manage or submits department ids from another organization
- **THEN** the system rejects the request
