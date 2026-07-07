## ADDED Requirements

### Requirement: Structured document output MUST define a constrained envelope
The system MUST define a versioned LicitaDoc structured document output envelope for generated procurement documents. The envelope MUST identify the document type, schema version, title, ordered document blocks, and any structured metadata needed to derive editor JSON and compatibility text. The envelope MUST support only approved block kinds and inline marks.

#### Scenario: Valid structured DFD envelope is accepted
- **WHEN** a provider returns a structured envelope for a `dfd` with approved blocks such as sections, paragraphs, lists, placeholders, and a signature block
- **THEN** the system accepts the envelope as valid structured document output

#### Scenario: Unsupported block is rejected
- **WHEN** a provider returns a structured envelope containing raw HTML, scriptable content, unknown block kinds, unknown inline marks, or unsupported presentation attributes
- **THEN** the system rejects the envelope instead of treating it as completed document content

### Requirement: Structured output validation MUST precede document projection
The system MUST validate structured document output before deriving any stored editor or text projection from it. Invalid structured output MUST produce a controlled generation failure or retry path and MUST NOT update a document as completed content.

#### Scenario: Malformed JSON does not complete generation
- **WHEN** the provider returns malformed JSON for a structured generation request
- **THEN** the system records the generation as failed or retries through the configured repair flow without marking the document as completed

#### Scenario: Document family mismatch is rejected
- **WHEN** a provider returns a structured envelope for `dfd` that includes sections or block roles belonging to `ETP`, `TR`, or `MINUTA`
- **THEN** the system rejects the envelope before deriving `draftContentJson` or `draftContent`

### Requirement: Structured output MUST project deterministically to editor JSON and compatibility text
The system MUST provide deterministic converters from valid structured output to Tiptap-compatible `draftContentJson` and compatibility `draftContent` text. These projections MUST be derived from the same validated structured source.

#### Scenario: Valid structured output derives editor JSON
- **WHEN** a completed generation has valid structured output
- **THEN** the system derives `draftContentJson` from the structured output for editor and preview use

#### Scenario: Valid structured output derives compatibility text
- **WHEN** a completed generation has valid structured output
- **THEN** the system derives `draftContent` compatibility text from the structured output instead of storing raw provider Markdown as the authoritative result

### Requirement: Legacy documents MUST remain readable without structured output
The system MUST keep existing generated documents readable when they do not have persisted structured output. Legacy resolution MUST prefer persisted structured output when present, then valid `draftContentJson`, and finally `draftContent` text conversion.

#### Scenario: Legacy document with editor JSON is resolved
- **WHEN** a completed legacy document has `draftContentJson` but no structured output envelope
- **THEN** the system continues to serve the document using the existing editor JSON and compatibility text behavior

#### Scenario: Legacy document with only text is resolved
- **WHEN** a completed legacy document has `draftContent` but no structured output envelope or valid `draftContentJson`
- **THEN** the system continues to derive usable document content from the text fallback
