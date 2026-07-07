## ADDED Requirements

### Requirement: Generated documents MUST use Tiptap JSON as the structured draft source
The system MUST persist generated document structure through `draftContentJson`. New generated documents MUST NOT require or persist a separate `draftContentAst` representation in order to be read, previewed, edited, or exported through supported flows.

#### Scenario: Generated document persists Tiptap JSON
- **WHEN** a valid generated document request completes with structured output enabled
- **THEN** the stored document contains `draftContentJson` as the structured draft source
- **AND** the stored document does not require `draftContentAst` for subsequent reads

#### Scenario: Document detail reads from Tiptap JSON
- **WHEN** an authorized actor reads a completed generated document with `draftContentJson`
- **THEN** the document detail response is derived from `draftContentJson` and compatibility text
- **AND** the read path does not prefer or require `draftContentAst`

#### Scenario: Legacy text-only document remains readable
- **WHEN** an authorized actor reads a completed generated document that has no `draftContentJson` but has compatibility text
- **THEN** the system still returns readable draft content through the legacy text fallback

### Requirement: Document persistence MUST NOT expose the retired AST column
The system MUST remove `draftContentAst` from active document persistence contracts once `draftContentJson` is the structured source. Application code and tests MUST NOT depend on `draft_content_ast` being present in the `documents` table.

#### Scenario: New document generation omits AST persistence
- **WHEN** the worker persists a successful generated document
- **THEN** it stores `draftContentJson` and compatibility `draftContent`
- **AND** it does not write a `draftContentAst` value

#### Scenario: Schema no longer includes AST field
- **WHEN** application code reads or writes document rows
- **THEN** the typed document schema has no active `draftContentAst` property
