# document-generation Specification

## Purpose
TBD - created by archiving change add-document-generation-foundation. Update Purpose after archive.
## Requirements
### Requirement: Procurement document generation MUST support the core draft types
The system MUST allow authorized actors to request generated procurement drafts of type `dfd`, `etp`, `tr`, and `minuta`. Every generated draft MUST belong to exactly one stored process and MUST inherit that process's organization scope.

#### Scenario: Authorized actor requests a supported document type
- **WHEN** an authenticated actor with visibility over a stored process requests generation of a `tr` draft for that process
- **THEN** the system creates a generated document draft linked to that process and its organization

#### Scenario: Request uses an unsupported document type
- **WHEN** an authenticated actor requests generation using a document type outside `dfd`, `etp`, `tr`, and `minuta`
- **THEN** the system rejects the request

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, and any optional operator instructions submitted with the request. The public API MUST NOT require callers to submit a raw provider prompt.

#### Scenario: Generation uses organization and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the `dfd` document type, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

### Requirement: Document generation MUST persist lifecycle state and generated content
The system MUST persist the generated document draft with a lifecycle state that supports status reads. A generation attempt MUST move the draft through `generating` and then finalize it as `completed` or `failed`. Successful generations MUST persist the generated draft content. Failed generations MUST persist the failure state for later inspection and retry.

#### Scenario: Successful generation stores completed draft content
- **WHEN** the provider returns generated content for a valid document-generation request
- **THEN** the system stores the draft content, marks the document as `completed`, and keeps it linked to the same process

#### Scenario: Provider failure stores failed generation state
- **WHEN** the provider call fails for a valid document-generation request
- **THEN** the system marks the document as `failed` and preserves the failed generation state instead of deleting the draft record

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings and detail reads MUST expose the document type and generation status, and detail reads MUST include the current draft content when generation has completed. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, and the stored draft content

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each document's type and generation status in the list response

