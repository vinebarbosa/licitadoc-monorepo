## ADDED Requirements

### Requirement: Generated administrative drafts MUST preserve signature closing presentation
The system MUST persist generated `dfd`, `etp`, and `tr` drafts with previewable structure that renders the final closing block without a visible `FECHO`, `ASSINATURA`, or equivalent heading. The local/date paragraph MUST be represented for right alignment, and the signature line, responsible name, and responsible role MUST be represented for center alignment.

#### Scenario: Successful generation stores formatted closing block
- **WHEN** a `dfd`, `etp`, or `tr` generation request completes successfully
- **THEN** the stored draft content does not include a closing heading matching `FECHO`, `ASSINATURA`, or an equivalent label
- **AND** the stored previewable document structure represents the local/date paragraph with right alignment
- **AND** the stored previewable document structure represents the signature line, responsible name, and responsible role with center alignment

#### Scenario: Document detail exposes formatted closing block for preview
- **WHEN** an authorized actor reads a completed generated `dfd`, `etp`, or `tr` document detail
- **THEN** the response includes previewable draft JSON that preserves the closing block alignment
- **AND** the preview can render the signature line above the centered responsible name and role without depending on a visible closing heading
