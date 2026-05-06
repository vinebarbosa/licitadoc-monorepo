## MODIFIED Requirements

### Requirement: Document generation MUST persist lifecycle state and generated content
The system MUST persist the generated document draft with a lifecycle state that supports status reads. A generation request MUST persist the draft and generation run in `generating` status and return the pending draft without waiting for provider output. Background generation execution MUST move the draft through `generating` and then finalize it as `completed` or `failed`. Successful generations MUST persist the generated draft content. Failed generations MUST persist the failure state for later inspection and retry.

#### Scenario: Generation request returns a pending draft before provider completion
- **WHEN** an authorized actor requests generation for a valid document-generation request
- **THEN** the system persists a generated document draft linked to the target process, persists a generation run, returns the draft with status `generating`, and schedules provider execution outside the HTTP request lifecycle

#### Scenario: Background generation uses persisted request context
- **WHEN** a pending generation run is executed after the create request has returned
- **THEN** the system invokes the provider using the persisted document type, process context, organization context, repository-managed recipe, and submitted instructions for that run

#### Scenario: Successful generation stores completed draft content
- **WHEN** the provider returns generated content for a valid document-generation run
- **THEN** the system stores the sanitized draft content, marks the document as `completed`, marks the generation run as `completed`, and keeps the document linked to the same process

#### Scenario: Provider failure stores failed generation state
- **WHEN** the provider call fails for a valid document-generation run
- **THEN** the system marks the document as `failed`, marks the generation run as `failed`, and preserves the failed generation state instead of deleting the draft record

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings and detail reads MUST expose the document type and generation status, detail reads for `generating` documents MUST expose the pending state without requiring draft content, and detail reads MUST include the current draft content when generation has completed. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a pending generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail while generation is still pending
- **THEN** the system returns the document type, generation status `generating`, parent `processId`, and no completed draft content

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, and the stored draft content

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each document's type and generation status in the list response
