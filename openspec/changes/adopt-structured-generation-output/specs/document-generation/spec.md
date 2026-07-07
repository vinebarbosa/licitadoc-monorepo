## ADDED Requirements

### Requirement: Document generation MUST use structured output as the final provider contract
For supported generated document types and configured providers, the final generation pipeline output MUST be validated structured document content rather than raw Markdown-only content. Markdown or plain text MAY remain as compatibility projections, but MUST NOT be the authoritative final generation contract when structured output is enabled.

#### Scenario: Provider returns structured document envelope
- **WHEN** a supported provider completes a structured generation request for a valid document-generation request
- **THEN** the pipeline obtains a structured document envelope that can be parsed and validated before persistence

#### Scenario: Compatibility text is derived after structured validation
- **WHEN** the system persists a generated document from valid structured output
- **THEN** any stored `draftContent` text is derived from the structured output instead of treated as the raw provider result

### Requirement: Generation metadata MUST distinguish structured and projected content
When debug metadata is requested, the generation pipeline MUST expose enough metadata to identify structured output validation status and projection status. Normal document reads MUST NOT expose raw provider JSON or internal validation details unless those fields are explicitly part of the public response contract.

#### Scenario: Debug metadata includes structured validation status
- **WHEN** a structured generation request completes with debug metadata enabled
- **THEN** generation metadata includes whether structured output parsing, validation, editor projection, and text projection succeeded

## MODIFIED Requirements

### Requirement: Document generation MUST persist lifecycle state and generated content
The system MUST persist the generated document draft with a lifecycle state that supports status reads. A generation attempt MUST move the draft through `generating` and then finalize it as `completed` or `failed`. Successful structured generations MUST persist validated structured document content when available, derive editable Tiptap JSON and compatibility text from that structured content, and keep the draft linked to the same process. Failed generations MUST persist the failure state for later inspection and retry.

#### Scenario: Successful generation stores completed draft content
- **WHEN** the provider returns valid structured content for a valid document-generation request
- **THEN** the system stores the structured draft content, derives `draftContentJson` and `draftContent`, marks the document as `completed`, and keeps it linked to the same process

#### Scenario: Provider failure stores failed generation state
- **WHEN** the provider call fails for a valid document-generation request
- **THEN** the system marks the document as `failed` and preserves the failed generation state instead of deleting the draft record

#### Scenario: Invalid structured output does not complete generation
- **WHEN** the provider returns content that cannot be parsed or validated as the configured structured document output
- **THEN** the system fails or retries the generation without marking the draft as `completed`

### Requirement: DFD generation MUST persist only DFD-structured draft content
The system MUST constrain generated `dfd` drafts to the canonical DFD structure and MUST NOT persist sections that belong to other procurement document families from the same reference source. The stored structured output and derived draft content for `dfd` MUST remain limited to the DFD structure even when the reference material used to build the recipe originally coexisted with `ETP` or `TR` content.

#### Scenario: Generated DFD omits ETP and TR sections
- **WHEN** the provider returns content for a valid `dfd` generation request
- **THEN** the validated structured output and stored draft projections follow the canonical DFD structure and do not include `ETP` or `TR` headings or body sections

#### Scenario: Structured DFD with non-DFD blocks is rejected
- **WHEN** the provider returns a structured `dfd` envelope containing `ETP`, `TR`, or `MINUTA` sections
- **THEN** the system rejects the structured output before marking the generation as completed
