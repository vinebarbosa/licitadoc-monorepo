## ADDED Requirements

### Requirement: Generated Tiptap JSON output MUST define a constrained document contract
The system MUST define a constrained Tiptap-compatible JSON contract for generated procurement documents. The contract MUST require a root `doc` node, MUST allow only backend-approved node types, marks, and attributes supported by the editor/preview renderer, and MUST reject unknown or unsafe structure.

#### Scenario: Valid generated Tiptap document is accepted
- **WHEN** a provider returns Tiptap-compatible JSON with root type `doc` and only approved nodes, marks, and attributes for a supported generated document type
- **THEN** the system accepts the JSON as valid generated document content

#### Scenario: Unsupported Tiptap structure is rejected
- **WHEN** a provider returns Tiptap-compatible JSON containing unknown nodes, unknown marks, raw HTML-like payloads, unsupported attributes, scriptable content, or an invalid root node
- **THEN** the system rejects the JSON instead of treating it as completed document content

### Requirement: Generated Tiptap JSON validation MUST precede document completion
The system MUST validate provider-returned Tiptap JSON before marking a generation run as `completed`. Invalid JSON, malformed Tiptap content, empty documents, unsupported document-family content, or failed deterministic projection MUST produce a controlled failure or explicit repair path and MUST NOT update the document as completed content.

#### Scenario: Malformed JSON does not complete generation
- **WHEN** the provider returns malformed JSON or a payload that cannot be parsed as the constrained Tiptap document contract
- **THEN** the system records a controlled generation failure or repair attempt without marking the document as `completed`

#### Scenario: Document family mismatch is rejected
- **WHEN** a provider returns valid Tiptap JSON for a `dfd` request that contains `ETP`, `TR`, or `MINUTA` sections
- **THEN** the system rejects the generated JSON before persistence as completed content

### Requirement: Generated Tiptap JSON MUST be the authoritative source for new generated documents
For new direct-json generations, the system MUST treat validated `draftContentJson` as the source of truth. Compatibility text, preview content, hashes, and downstream non-editor projections MUST be derived from the validated Tiptap JSON rather than from raw provider Markdown or the previous LicitaDoc AST envelope.

#### Scenario: Successful direct-json generation persists authoritative editor JSON
- **WHEN** a provider returns valid constrained Tiptap JSON for a generated document request
- **THEN** the system stores that JSON as `draftContentJson` and treats it as the authoritative generated content

#### Scenario: Compatibility text is derived from Tiptap JSON
- **WHEN** a direct-json generated document is completed
- **THEN** the stored `draftContent` compatibility text is derived deterministically from the validated `draftContentJson`

### Requirement: Legacy document content MUST remain resolvable
The system MUST keep existing generated documents readable when they do not have authoritative direct-json generation content. Read-time content resolution MUST preserve compatibility with existing `draftContentJson`, legacy structured AST content, and legacy text-only content.

#### Scenario: Legacy document with valid editor JSON is served
- **WHEN** a completed legacy document has valid `draftContentJson`
- **THEN** the system serves that JSON for editor and preview use

#### Scenario: Legacy document without editor JSON remains readable
- **WHEN** a completed legacy document lacks valid `draftContentJson` but has legacy structured AST content or text content
- **THEN** the system derives usable document content through the existing fallback behavior
