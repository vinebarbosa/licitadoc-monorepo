## MODIFIED Requirements

### Requirement: Document generation MUST persist lifecycle state and generated content
The system MUST persist the generated document draft with a lifecycle state that supports status reads. A generation attempt MUST move the draft through `generating` and then finalize it as `completed` or `failed`. Successful generations MUST persist validated structured document content when available, derive editable Tiptap JSON and compatibility text from that structured content, and keep the draft linked to the same process. Failed generations MUST persist the failure state for later inspection and retry.

#### Scenario: Successful generation stores completed structured draft content
- **WHEN** the provider returns valid structured content for a valid document-generation request
- **THEN** the system stores the structured draft content, derives Tiptap JSON and compatibility text, marks the document as `completed`, and keeps it linked to the same process

#### Scenario: Provider failure stores failed generation state
- **WHEN** the provider call fails for a valid document-generation request
- **THEN** the system marks the document as `failed` and preserves the failed generation state instead of deleting the draft record

#### Scenario: Invalid structured content does not complete generation
- **WHEN** the provider returns content that cannot be validated or normalized into the structured document contract
- **THEN** the system does not persist that invalid content as a completed draft

## ADDED Requirements

### Requirement: Document generation MUST use structured output as the final provider contract
For supported generated document types, the final generation pipeline output MUST be validated structured document content rather than a `.docx` file or raw Markdown-only document. Markdown or plain text can remain as compatibility projections, but MUST NOT be the authoritative final generation contract after structured content is available.

#### Scenario: Provider returns structured document envelope
- **WHEN** a supported DFD, ETP, TR, or Minuta generation reaches its final writer or structuring stage
- **THEN** the pipeline obtains a structured document envelope that can be parsed into the LicitaDoc document AST

#### Scenario: Markdown remains derived compatibility output
- **WHEN** the system persists a generated document with structured content
- **THEN** any stored `draftContent` text is derived from structured content instead of treated as the sole canonical generation result

### Requirement: Generation debug metadata MUST distinguish structured and projected content
When debug mode is requested, the generation pipeline MUST expose enough metadata to understand structured output validation and projection. Normal responses MUST NOT expose raw provider JSON or internal AST validation details unless those fields are explicitly part of the public response contract.

#### Scenario: Debug response includes structured validation status
- **WHEN** an authorized actor requests document generation with debug mode
- **THEN** debug metadata includes structured output validation status and projection status for AST, editor JSON, and compatibility text

#### Scenario: Normal response hides raw provider structure
- **WHEN** an authorized actor requests document generation without debug mode
- **THEN** the response does not expose raw provider JSON, validation internals, or prompt-only structural diagnostics
