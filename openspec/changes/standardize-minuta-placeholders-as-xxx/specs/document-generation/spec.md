## ADDED Requirements

### Requirement: Generated final content MUST NOT expose internal template placeholders
The system MUST ensure generated final document content does not expose unresolved internal template syntax such as `{{...}}` in persisted Markdown, persisted Tiptap JSON, live preview completion content, print output, or exported PDF output.

#### Scenario: Minuta contains unresolved budget placeholder
- **WHEN** a Minuta generation draft contains `{{budget.allocation_or_placeholder}}` after the Writer, Humanization Pass, or Rewrite stage
- **THEN** the final persisted document content replaces that token with a human-facing `XXX`-style placeholder before preview or PDF rendering

#### Scenario: Final content is persisted after sanitization
- **WHEN** document generation completes
- **THEN** `draftContent` and `draftContentJson` contain the sanitized final content without unresolved `{{...}}` tokens

### Requirement: Minuta missing fields MUST render as contract-facing placeholders
The system MUST render missing Minuta fields as contract-facing placeholders, not as explanatory absence text and not as internal pipeline or template syntax.

#### Scenario: Budget allocation is absent
- **WHEN** a Minuta is generated and the process has no valid budget allocation
- **THEN** the dotacao orcamentaria clause uses `XXX`-style placeholder text instead of `{{budget.allocation_or_placeholder}}`

#### Scenario: Price is absent or zero
- **WHEN** a Minuta is generated from a process whose price is absent or zero
- **THEN** the price clause uses a price placeholder such as `R$ XX.XXX,XX` and does not treat zero as a valid price
