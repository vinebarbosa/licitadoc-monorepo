## ADDED Requirements

### Requirement: Document edit page SHALL render a focused editing workspace
The system SHALL render the document edit route as a focused page-only workspace for the selected editable document, with the document editor as the primary content and without unrelated demo, assistant, suggestion, or decorative workflow UI.

#### Scenario: Editable document opens in focused workspace
- **WHEN** an authenticated user opens the document edit route for a completed document with valid editor JSON content
- **THEN** the page displays the document editor workspace for that document
- **AND** the document sheet or editing surface is the primary page content
- **AND** the page does not display demo-only panels, assistant prompt controls, AI suggestion controls, unrelated process summary cards, or non-editing decorative sections

#### Scenario: Non-editable document states remain explicit
- **WHEN** the selected document is loading, missing, still generating, failed, forbidden, or lacks valid editor JSON content
- **THEN** the page displays the matching unavailable, loading, retry, or empty-content state instead of the editor
- **AND** the state provides a safe path back to the documents area when editing cannot continue

### Requirement: Document edit page SHALL provide a persistent formatting header
The system SHALL provide a persistent editor header on the document edit page with document actions and formatting controls connected to the active editor selection.

#### Scenario: Header exposes document actions
- **WHEN** an editable document is open
- **THEN** the header displays controls to return from the page, open the document preview, save changes, and communicate save state
- **AND** navigation away from dirty content requires confirmation before discarding unsaved changes

#### Scenario: Header exposes formatting controls
- **WHEN** an editable document is open
- **THEN** the header provides controls for paragraph and heading styles, undo, redo, bold, italic, underline, strikethrough, highlight, bulleted list, numbered list, and text alignment
- **AND** each control applies its command to the current editor selection or insertion point
- **AND** active formatting controls indicate their active state when the current selection matches that formatting

#### Scenario: Header remains usable across viewports
- **WHEN** the document edit page is viewed on desktop or mobile widths
- **THEN** the header controls remain reachable without overlapping page content
- **AND** controls use accessible names or tooltips that identify their action

### Requirement: Document edit page SHALL preserve document save behavior
The system SHALL preserve the existing document edit persistence contract while replacing the page presentation.

#### Scenario: User saves edited JSON content
- **WHEN** the user changes the document content or formatting and activates save
- **THEN** the page sends the updated editor JSON through the existing document save flow with the current source content hash
- **AND** the save control is disabled when there are no unsaved changes
- **AND** successful saves update the saved baseline so the page returns to a saved state

#### Scenario: Save error or conflict occurs
- **WHEN** the save request fails or the backend reports a content conflict
- **THEN** the page displays a clear save error or conflict message without losing the user's current editor content
- **AND** editing the document again clears stale save error presentation once the content changes

### Requirement: Document edit page SHALL remain owned by the documents module
The system SHALL keep the real document edit page implementation inside the documents module and SHALL NOT depend on the public demo page experience for production editing behavior.

#### Scenario: Production route renders document-module editor
- **WHEN** the application renders the production document edit route
- **THEN** the page uses documents-module UI and model code for the editing workspace
- **AND** it does not import or render the public document editor demo experience as the production editor
