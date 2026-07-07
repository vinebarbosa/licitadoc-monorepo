## ADDED Requirements

### Requirement: Generation recipes MUST describe structured output boundaries
Repository-managed generation recipes for supported document types MUST describe the required structured output boundaries for the LicitaDoc document envelope, including allowed block kinds, required document role, placeholders, signature handling, and prohibited raw file or HTML output.

#### Scenario: Recipe instructs provider to return structured content
- **WHEN** a supported document recipe is loaded for structured generation
- **THEN** the prompt or provider request instructs the provider to return structured document content and not a DOCX file, base64 file, OOXML package, HTML document, Markdown code fence, or renderer-specific payload

#### Scenario: Recipe preserves document family in structured output
- **WHEN** the backend prepares a structured `dfd` generation request
- **THEN** the structured output instructions require blocks that match DFD structure and prohibit headings or sections belonging to ETP, TR, or Minuta

## MODIFIED Requirements

### Requirement: DFD generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `dfd` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include textual instruction assets, canonical DFD structural guidance, and structured-output instructions that allow the pipeline to obtain valid LicitaDoc structured document content. Any Markdown template retained for prompt context MUST NOT be treated as the authoritative final provider output contract when structured generation is enabled.

#### Scenario: Backend resolves the DFD recipe
- **WHEN** the backend prepares a `dfd` generation request for a stored process
- **THEN** it resolves repository-managed instruction assets, canonical DFD structural guidance, and structured-output instructions for `dfd` before invoking the generation provider

### Requirement: DFD Markdown template MUST represent only the canonical DFD structure
The system MUST provide canonical DFD structural guidance derived only from the `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)` portion of the approved reference document. The template or structured guidance MUST include only the DFD sections for solicitation data, demand context, contracting object, justification, essential requirements, and signature block. The template and structured guidance MUST NOT include `ETP` or `TR` sections.

#### Scenario: DFD template excludes non-DFD sections
- **WHEN** the canonical `dfd` template or structured guidance is reviewed or loaded for prompt assembly
- **THEN** it contains only DFD headings, placeholders, and structural blocks, and does not include headings or structural blocks for `ETP` or `TR`
