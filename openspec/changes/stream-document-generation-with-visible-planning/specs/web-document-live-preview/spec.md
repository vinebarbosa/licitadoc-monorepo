## ADDED Requirements

### Requirement: Document preview MUST show planning progress separately from the generated document
The document preview page MUST render realtime planning/thinking progress for a generating document in a dedicated UI area that is visually separate from the generated document sheet. Planning progress MUST NOT be rendered as part of the document body.

#### Scenario: Planning progress arrives before document text
- **WHEN** a user opens the preview page for a generating document
- **AND** the realtime stream emits planning progress before generated document text
- **THEN** the page renders the planning progress area
- **AND** the document sheet remains absent or pending until generated document text is available

#### Scenario: Planning and document text are both available
- **WHEN** the realtime stream emits both planning progress and generated document text
- **THEN** the page renders planning progress in its dedicated area
- **AND** the page renders generated document text in the document layout
- **AND** the two streams remain visually and semantically separate

#### Scenario: Planning progress updates live
- **WHEN** the realtime stream emits planning deltas over time
- **THEN** the planning area updates incrementally without replacing generated document text

### Requirement: Final document preview MUST remain composed only from generated document text
The document preview page MUST continue to build the document sheet only from generated document text chunks and completed persisted document content. Planning/thinking progress MUST NOT appear in the final document preview, print output, or exportable content.

#### Scenario: Document text chunks arrive after planning
- **WHEN** generated document text chunks arrive after planning progress
- **THEN** the page displays the document text with the existing typewriter-style live preview behavior
- **AND** no planning progress appears in the document body

#### Scenario: Generation completes
- **WHEN** the realtime stream emits completion for the current document
- **THEN** the page refetches the authoritative document detail
- **AND** the completed document view renders persisted document content without planning progress

#### Scenario: Partial content actions remain disabled
- **WHEN** planning progress or partial generated document text is visible during generation
- **THEN** print and export actions remain disabled
- **AND** those actions become eligible only after the document detail reports completed persisted content

### Requirement: Planning progress MUST degrade safely
The document preview page MUST continue to work when planning progress is unavailable, unsupported by the active provider, or interrupted by stream failure.

#### Scenario: Provider emits only document text
- **WHEN** the realtime stream emits generated document text without planning progress
- **THEN** the preview page renders the live document preview using the existing generated text behavior
- **AND** the planning area does not block document rendering

#### Scenario: Realtime stream fails
- **WHEN** the preview page cannot establish or maintain the realtime stream
- **THEN** the page closes the broken stream
- **AND** existing document detail polling continues while the document remains in `generating` status
