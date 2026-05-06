# document-generation-recipes Specification

## Purpose
TBD - created by archiving change add-dfd-generation-skill-from-process. Update Purpose after archive.
## Requirements
### Requirement: DFD generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `dfd` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include a textual instruction asset and a Markdown template asset.

#### Scenario: Backend resolves the DFD recipe
- **WHEN** the backend prepares a `dfd` generation request for a stored process
- **THEN** it resolves a repository-managed instruction asset and a repository-managed Markdown template for `dfd` before invoking the generation provider

### Requirement: DFD Markdown template MUST represent only the canonical DFD structure
The system MUST provide a canonical Markdown model for `dfd` that is derived only from the `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)` portion of the approved reference document. The template MUST include the DFD sections for solicitation data, demand context, contracting object, justification, essential requirements, and signature block. The template MUST NOT include `ETP` or `TR` sections.

#### Scenario: DFD template excludes non-DFD sections
- **WHEN** the canonical `dfd` template is reviewed or loaded for prompt assembly
- **THEN** it contains only DFD headings and placeholders, and does not include headings or structural blocks for `ETP` or `TR`

