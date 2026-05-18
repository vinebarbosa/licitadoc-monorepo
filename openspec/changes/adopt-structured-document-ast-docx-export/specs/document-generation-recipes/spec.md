## MODIFIED Requirements

### Requirement: DFD generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `dfd` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include textual instruction assets, the document's canonical structural guidance, and structured-output instructions that allow the pipeline to obtain valid LicitaDoc document AST content.

#### Scenario: Backend resolves the DFD recipe
- **WHEN** the backend prepares a `dfd` generation request for a stored process
- **THEN** it resolves repository-managed instruction assets, canonical DFD structural guidance, and structured-output instructions for `dfd` before invoking the generation provider

### Requirement: DFD Markdown template MUST represent only the canonical DFD structure
The system MUST provide a canonical DFD structural model derived only from the `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)` portion of the approved reference document. Any Markdown template retained for prompt context or compatibility MUST include only the DFD sections for solicitation data, demand context, contracting object, justification, essential requirements, and signature block. The template and structured guidance MUST NOT include `ETP` or `TR` sections.

#### Scenario: DFD template excludes non-DFD sections
- **WHEN** the canonical `dfd` template or structured guidance is reviewed or loaded for prompt assembly
- **THEN** it contains only DFD headings and placeholders, and does not include headings or structural blocks for `ETP` or `TR`

## ADDED Requirements

### Requirement: Generation recipes MUST describe structured output boundaries
Repository-managed generation recipes for supported document types MUST describe the required structured output boundaries for the LicitaDoc document AST, including allowed block kinds, required document role, placeholders, signature handling, and prohibited raw file or HTML output.

#### Scenario: Recipe forbids DOCX output from provider
- **WHEN** the backend assembles a generation prompt for DFD, ETP, TR, or Minuta
- **THEN** the prompt instructs the provider to return structured document content and not a DOCX file, base64 file, OOXML package, HTML document, or renderer-specific payload

#### Scenario: Recipe preserves document role in AST
- **WHEN** the backend assembles a generation prompt for a specific document type
- **THEN** the structured output instructions require blocks that match that document type and prohibit headings or sections belonging to other document families
