## MODIFIED Requirements

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
