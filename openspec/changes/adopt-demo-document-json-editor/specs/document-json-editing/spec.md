## ADDED Requirements

### Requirement: Protected document editor MUST use the validated demo UI
The protected `/app/documento/:documentId` editor MUST use the visual and interaction model validated in `/demo/documento/editor`, including the focused document canvas, compact icon-first toolbar, page-like sheet spacing, Portuguese controls, save status, and agent-like AI instruction input.

#### Scenario: User opens editable document route
- **WHEN** an authenticated user opens `/app/documento/document-1` for an editable completed document
- **THEN** the editor renders the validated document editing surface instead of a dashboard-style form or a redesigned editor shell
- **AND** the document canvas is the dominant visual object

#### Scenario: Demo remains available for validation
- **WHEN** a user opens `/demo/documento/editor`
- **THEN** the public demo remains available as a validation surface for the same editor experience

### Requirement: Editor MUST load and save Tiptap JSON
The protected editor MUST initialize Tiptap from the document detail's JSON draft content and MUST send updated Tiptap JSON when saving. The editor MUST NOT use Markdown or HTML as its primary editable state.

#### Scenario: Document has stored JSON content
- **WHEN** the document detail response includes `draftContentJson`
- **THEN** the editor initializes from that JSON structure
- **AND** formatting, lists, headings, and paragraphs remain editable as Tiptap nodes

#### Scenario: User saves edited content
- **WHEN** a user edits the document and saves
- **THEN** the save request sends the current Tiptap JSON document
- **AND** the save request includes the current source content hash for stale-write protection

### Requirement: Editor MUST preserve selected-text AI workflow feedback
The protected editor MUST allow a user to select document text, keep visible feedback for the selection while interacting with the AI instruction input, and apply or discard Portuguese-labeled suggestions without losing the user's context.

#### Scenario: User selects text and focuses AI input
- **WHEN** a user selects text in the document and focuses the AI instruction input
- **THEN** the editor keeps a visible selected-text highlight or equivalent feedback
- **AND** the AI input receives stronger visual emphasis

#### Scenario: Suggestion actions are displayed
- **WHEN** an AI suggestion is available for selected text
- **THEN** the actions use Portuguese labels such as "Rejeitar", "Aceitar", "Rejeitar tudo", and "Aceitar tudo"
- **AND** accepting a suggestion replaces the selected text in the Tiptap document

### Requirement: Editor spacing MUST support official document writing
The protected editor MUST preserve automatic paragraph indentation, editable paragraph spacing, list indentation, page-like gaps between sheets, and Tab behavior suitable for organizing official document content.

#### Scenario: Paragraphs render with initial indentation
- **WHEN** generated paragraph content is shown in the editor
- **THEN** body paragraphs render with an initial indent by default
- **AND** the user can remove that indentation through normal editing when needed

#### Scenario: Lists are indented
- **WHEN** bullet or numbered lists are shown in the editor
- **THEN** list items render with visible indentation and stable spacing

#### Scenario: Tab is used inside the editor
- **WHEN** the cursor or selection is in document content and the user presses Tab or Shift+Tab
- **THEN** the editor handles paragraph/list indentation behavior instead of moving focus to the AI instruction input

### Requirement: Editor save flow MUST preserve user work
The editor MUST expose saved, saving, unsaved, conflict, and error states while keeping the user's current Tiptap JSON content intact on failed saves.

#### Scenario: Save succeeds
- **WHEN** a user saves edited JSON content successfully
- **THEN** the page updates the visible save state to saved
- **AND** the current JSON content becomes the new source content for future stale-save checks

#### Scenario: Save fails
- **WHEN** a save request fails because of a network error, server error, or stale source hash
- **THEN** the page keeps the user's edited Tiptap content in the editor
- **AND** the page gives the user a visible retry or conflict state
