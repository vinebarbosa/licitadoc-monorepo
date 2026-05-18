## ADDED Requirements

### Requirement: Generated DFD ETP and TR drafts MUST strip closing alignment HTML before persistence
The system MUST sanitize generated DFD, ETP, and TR drafts before marking generation as completed so closing/signature layout wrappers are not persisted as document text. If a provider returns simple HTML alignment wrappers around the local/date line, signature line, responsible name, or responsible role, the system MUST preserve the inner administrative text and remove the HTML wrapper before storing `draftContent` or deriving `draftContentJson`.

#### Scenario: Provider returns div alignment wrappers in a closing block
- **WHEN** a DFD, ETP, or TR generation provider response contains closing lines wrapped in `<div align="right">` or `<div align="center">`
- **THEN** the completed draft content stores the same local/date, signature, responsible name, and role text without `<div>`, `</div>`, or `align=` strings
- **AND** the completed draft JSON is derived from the cleaned content

#### Scenario: Provider returns canonical plain closing lines
- **WHEN** a DFD, ETP, or TR generation provider response already contains the canonical plain-text closing block
- **THEN** the sanitizer preserves the closing text and does not add HTML, CSS, table syntax, or visible closing headings

### Requirement: Signature closing alignment MUST be represented in Tiptap JSON and preview rendering
The system MUST represent DFD, ETP, and TR signature closing alignment through application-owned document structure, not through generated raw HTML. For canonical closing blocks, the local/date paragraph MUST be represented with right alignment, and the signature line, responsible person name, and responsible role paragraphs MUST be represented with center alignment. The rendered preview MUST not display `FECHO`, `ASSINATURA`, literal HTML tags, or provider layout markup for the closing block.

#### Scenario: Clean closing block is converted to aligned JSON
- **WHEN** cleaned DFD, ETP, or TR content contains a local/date line followed by a signature line, responsible name, and responsible role
- **THEN** the generated Tiptap JSON marks the local/date paragraph as right-aligned and the signature line, name, and role paragraphs as center-aligned

#### Scenario: Document detail preview has no literal HTML
- **WHEN** an authorized actor reads a completed DFD, ETP, or TR document generated from provider output that attempted HTML alignment
- **THEN** the response content and previewable JSON do not expose literal `<div>` or `align` text in the closing block

#### Scenario: Preview renders the closing block without a visible heading
- **WHEN** the document preview renders a completed DFD, ETP, or TR draft with a signature closing block
- **THEN** the local/date appears right-aligned, the signature line/name/role appear centered, and no `FECHO`, `ASSINATURA`, or equivalent closing heading is visible
