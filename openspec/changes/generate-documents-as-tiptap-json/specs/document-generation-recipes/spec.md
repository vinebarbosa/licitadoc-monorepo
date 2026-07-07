## ADDED Requirements

### Requirement: Document generation recipes MUST request direct Tiptap JSON output
Repository-managed document generation recipes MUST instruct providers to return the constrained Tiptap JSON document shape directly for DFD, ETP, TR, and Minuta generation. Recipes MUST NOT ask the provider to return Markdown, HTML, DOCX, OOXML, base64 files, or the previous LicitaDoc AST envelope as the final generated output.

#### Scenario: Recipe instructs direct editor JSON output
- **WHEN** the backend loads a repository-managed recipe for a supported generated document type
- **THEN** the recipe instructions require a constrained Tiptap JSON document as the final provider response

#### Scenario: Recipe avoids Markdown final output
- **WHEN** the backend assembles a provider prompt for direct-json generation
- **THEN** the prompt does not instruct the provider to return Markdown as the final generated document

### Requirement: Document generation recipes MUST describe canonical Tiptap document structure
Repository-managed recipes MUST describe the expected section ordering, required placeholders, document-family boundaries, and signature/closing behavior in terms compatible with the constrained Tiptap JSON output contract.

#### Scenario: DFD recipe describes DFD-only Tiptap structure
- **WHEN** the canonical DFD recipe is reviewed or loaded for prompt assembly
- **THEN** it describes only DFD headings, placeholders, body content, and signature structure using the constrained Tiptap JSON output contract

## MODIFIED Requirements

### Requirement: DFD generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `dfd` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include textual instruction assets and the constrained Tiptap JSON output contract required for direct editor JSON generation.

#### Scenario: Backend resolves the DFD recipe
- **WHEN** the backend prepares a `dfd` generation request for a stored process
- **THEN** it resolves repository-managed instruction assets and the constrained Tiptap JSON output contract for `dfd` before invoking the generation provider

## REMOVED Requirements

### Requirement: DFD Markdown template MUST represent only the canonical DFD structure
**Reason**: New generated documents no longer use Markdown as the final provider output or authoritative document shape.
**Migration**: Preserve any useful canonical DFD structure from the Markdown template as recipe guidance for the constrained Tiptap JSON output contract.
