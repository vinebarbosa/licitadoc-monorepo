## ADDED Requirements

### Requirement: SD-backed generation MUST complete without local review or rewrite
For SD-backed generated documents, the system MUST NOT run the previous local review and rewrite loop before completion. The system MUST rely on direct Tiptap JSON generation, schema validation, document-family validation, and deterministic projections as the completion gate.

#### Scenario: Direct-json generation uses no review stages
- **WHEN** an SD-backed document generation request completes through the direct-json path
- **THEN** generation metadata contains no `writer`, `humanization`, `review`, or `rewrite` execution stages

#### Scenario: Invalid JSON fails validation instead of entering text rewrite
- **WHEN** a direct-json provider response fails Tiptap JSON validation
- **THEN** the system fails or repairs through an explicit structured-json path without invoking the previous text rewrite prompt

## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed direct Tiptap JSON output contract, resolved department and source metadata when available, the process data, the organization data, and the submitted instructions before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, the direct Tiptap JSON output contract, resolved department and source metadata when available, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

### Requirement: Document generation MUST persist lifecycle state and generated content
The system MUST persist the generated document draft with a lifecycle state that supports status reads. A generation attempt MUST move the draft through `generating` and then finalize it as `completed` or `failed`. Successful direct-json generations MUST persist validated Tiptap JSON as authoritative `draftContentJson`, derive `draftContent` compatibility text from that JSON, and keep the draft linked to the same process. Failed generations MUST persist the failure state for later inspection and retry.

#### Scenario: Successful generation stores completed draft content
- **WHEN** the provider returns valid constrained Tiptap JSON for a valid document-generation request
- **THEN** the system stores the generated JSON as authoritative `draftContentJson`, derives `draftContent`, marks the document as `completed`, and keeps it linked to the same process

#### Scenario: Provider failure stores failed generation state
- **WHEN** the provider call fails for a valid document-generation request
- **THEN** the system marks the document as `failed` and preserves the failed generation state instead of deleting the draft record

#### Scenario: Invalid generated JSON does not complete generation
- **WHEN** the provider returns content that cannot be parsed or validated as the constrained Tiptap JSON document output
- **THEN** the system fails or repairs the generation without marking the draft as `completed`

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings and detail reads MUST expose the document type and generation status, and detail reads MUST include the current draft content when generation has completed. For new direct-json generated documents, detail reads MUST expose the authoritative `draftContentJson` and compatibility `draftContent` derived from it. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, authoritative `draftContentJson`, and the stored compatibility draft content

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each document's type and generation status in the list response

### Requirement: DFD generation MUST persist only DFD-structured draft content
The system MUST constrain generated `dfd` drafts to the canonical DFD structure and MUST NOT persist sections that belong to other procurement document families from the same reference source. The authoritative `draftContentJson` and derived draft content for `dfd` MUST remain limited to the DFD structure even when the reference material used to build the recipe originally coexisted with `ETP` or `TR` content.

#### Scenario: Generated DFD omits ETP and TR sections
- **WHEN** the provider returns content for a valid `dfd` generation request
- **THEN** the validated Tiptap JSON and stored draft projections follow the canonical DFD structure and do not include `ETP` or `TR` headings or body sections

#### Scenario: Tiptap DFD with non-DFD blocks is rejected
- **WHEN** the provider returns Tiptap JSON for a `dfd` request containing `ETP`, `TR`, or `MINUTA` sections
- **THEN** the system rejects the generated JSON before marking the generation as completed
