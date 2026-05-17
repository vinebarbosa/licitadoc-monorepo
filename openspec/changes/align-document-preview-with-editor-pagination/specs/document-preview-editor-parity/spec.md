## ADDED Requirements

### Requirement: Completed preview MUST render saved editor JSON with visual parity
The completed document preview MUST render the saved TipTap JSON document when `draftContentJson` is available, using the same document typography, sheet dimensions, margins, paragraph indentation, list indentation, text alignment, inline marks, and spacing rules used by the validated editor surface.

#### Scenario: User previews a saved TipTap document
- **WHEN** a user edits a completed document, saves the updated TipTap JSON, and opens `/app/documento/document-1/preview`
- **THEN** the preview renders the saved JSON structure instead of a lossy Markdown-only representation
- **AND** headings, paragraphs, lists, alignment, indentation, links, bold, italic, underline, strikethrough, and highlights match the editor presentation

#### Scenario: Preview reloads after saved edit
- **WHEN** the document detail response contains updated `draftContentJson`
- **THEN** the completed preview uses that JSON as its primary render source
- **AND** the preview does not display stale compatibility text when the JSON content differs

### Requirement: Editor and preview MUST share the same page-surface contract
The editor and completed preview MUST use a shared page-surface contract for formal document display. The shared contract MUST define the visible sheet width, page margins, usable text area, paragraph body style, list style, page gap, background, and print mapping so changes to the document surface do not drift between modes.

#### Scenario: User compares editor and preview
- **WHEN** a user saves a document in the editor and immediately opens the preview
- **THEN** the document body appears on the same formal sheet geometry in both places
- **AND** differences are limited to edit-only controls, preview-only controls, and selection affordances

#### Scenario: Responsive layout changes
- **WHEN** the editor and preview are opened on a narrow viewport
- **THEN** both modes keep the same readable document constraints and proportional margins
- **AND** text does not overlap controls or overflow the page surface horizontally

### Requirement: Page breaks MUST appear in both editor and preview
The document editor and completed preview MUST render persisted page-break nodes as subtle gaps between document sheets. Page breaks MUST be visible enough for users to understand page boundaries, MUST NOT show a text label by default, and MUST survive save, reload, and preview round trips.

#### Scenario: Existing page break appears in editor
- **WHEN** a document JSON contains a persisted page-break representation
- **THEN** the editor renders a visual gap between pages at that position
- **AND** the gap uses the editor background color between distinct sheet areas

#### Scenario: Saved page break appears in preview
- **WHEN** a user saves a document that contains a page break and opens the preview
- **THEN** the preview renders the page break at the same content position
- **AND** the preview gap visually matches the editor page gap

#### Scenario: Browser print handles page break
- **WHEN** a user prints a preview containing a persisted page break
- **THEN** the printed output starts the following content on a new page where browser print layout supports CSS page breaks
- **AND** screen-only shadows, gaps, and controls do not print as document content

### Requirement: Completed preview MUST preserve legacy document compatibility
The completed preview MUST remain usable for documents that do not yet have saved TipTap JSON. When `draftContentJson` is absent, the preview MUST render from the best available legacy content without breaking existing completed, generating, failed, loading, or empty states.

#### Scenario: Completed legacy document has only text content
- **WHEN** a completed document detail includes non-empty `draftContent` and no `draftContentJson`
- **THEN** the preview renders the document through the legacy-compatible path
- **AND** the page does not show an empty-content state

#### Scenario: Generating document streams text
- **WHEN** a document is still generating and live text content is available
- **THEN** the live preview continues to render the streaming content
- **AND** JSON preview rendering is not required before completion

### Requirement: Preview text adjustment MUST remain available on JSON-rendered documents
The completed preview MUST keep the selected-text adjustment workflow available when rendering from TipTap JSON. Selecting visible document text MUST still provide enough selected text and surrounding context for the existing suggestion and apply flow.

#### Scenario: User selects text in JSON preview
- **WHEN** a user selects visible text in a completed preview rendered from TipTap JSON
- **THEN** the preview captures the selected text and context
- **AND** the text-adjustment input can open for that selection

#### Scenario: User applies adjustment from preview
- **WHEN** the user accepts an adjustment for selected preview text
- **THEN** the document refreshes with the updated persisted content
- **AND** subsequent editor and preview loads remain visually aligned
