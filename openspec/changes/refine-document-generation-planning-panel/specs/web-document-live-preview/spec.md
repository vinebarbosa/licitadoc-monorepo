## ADDED Requirements

### Requirement: Planning progress MUST render as a compact status panel
The document preview page MUST present realtime planning/thinking progress as a compact status panel rather than a raw reasoning transcript. The panel MUST communicate that the AI is preparing the document through concise, product-facing status or phase messaging.

#### Scenario: Planning progress is available before document text
- **WHEN** a user opens the preview page for a generating document
- **AND** the realtime stream emits planning progress before generated document text
- **THEN** the page renders a compact planning status panel
- **AND** the panel uses concise phase or status messaging instead of a large raw transcript block

#### Scenario: Planning progress updates while document text is still absent
- **WHEN** planning progress continues to arrive for a generating document
- **AND** no generated document text chunk has arrived yet
- **THEN** the planning panel remains visible and updates its active status or progress treatment
- **AND** the page keeps the pending document preview state available until generated document text exists

### Requirement: Planning progress MUST NOT expose raw reasoning controls
The document preview page MUST NOT provide a button, disclosure, drawer, modal, or equivalent control for showing detailed raw reasoning in this iteration.

#### Scenario: Planning panel is visible
- **WHEN** the compact planning panel is rendered
- **THEN** the page does not render a control for opening detailed raw reasoning
- **AND** raw planning content is not presented as a user-facing transcript

### Requirement: Compact planning panel MUST remain separate from document content
The compact planning panel MUST remain visually and semantically separate from the generated document sheet. Planning/thinking progress MUST NOT appear in the document body, persisted document content, print output, or exportable content.

#### Scenario: Planning and generated document text are both available
- **WHEN** the realtime stream emits both planning progress and generated document text
- **THEN** the page renders the compact planning panel outside the document sheet
- **AND** the document sheet renders only generated document text or completed persisted document content

#### Scenario: Generation completes
- **WHEN** the realtime stream emits completion for the current document
- **THEN** the page refetches the authoritative document detail
- **AND** the completed document preview renders without planning/thinking progress
