## ADDED Requirements

### Requirement: Document preview MUST render live generated content
The document preview page MUST subscribe to realtime generation events for documents in `generating` status and render partial generated content in the document preview layout as chunks arrive.

#### Scenario: Generating document emits partial content
- **WHEN** a user opens the preview page for a document that is still generating
- **AND** the realtime stream emits generated text progress
- **THEN** the preview page renders the accumulated partial content in the document layout
- **AND** the page continues to show that the document is still in generation

#### Scenario: Generating document has no streamed content yet
- **WHEN** a user opens the preview page for a generating document before any text chunk is available
- **THEN** the page keeps the existing pending generation state instead of showing an empty document sheet

#### Scenario: Generation completes from realtime stream
- **WHEN** the realtime stream emits a completion event for the current document
- **THEN** the preview page invalidates or refetches the document detail query
- **AND** the page renders the persisted completed document content after the detail read returns

#### Scenario: Generation fails from realtime stream
- **WHEN** the realtime stream emits a failure event for the current document
- **THEN** the preview page refreshes document detail
- **AND** the page renders the failed generation state instead of stale partial content

### Requirement: Document preview MUST degrade safely when realtime streaming is unavailable
The document preview page MUST keep the existing polling-based status refresh as a fallback when the realtime event stream cannot be opened or is interrupted.

#### Scenario: Realtime stream connection fails
- **WHEN** the preview page cannot establish or maintain the document generation event stream
- **THEN** the page closes the broken stream
- **AND** the existing document detail polling continues while the document remains in `generating` status

#### Scenario: User leaves the preview page
- **WHEN** the preview page unmounts or switches to a different document id
- **THEN** the page closes the previous realtime subscription
- **AND** no further events from the previous document update the visible preview

### Requirement: Partial previews MUST keep unsafe actions disabled
The document preview page MUST keep export and print actions disabled while rendering partial generated content for a document that is not yet completed.

#### Scenario: Partial content is visible during generation
- **WHEN** the preview page is rendering accumulated partial content for a generating document
- **THEN** print and export actions remain disabled
- **AND** those actions become eligible only after the document detail reports completed persisted content
