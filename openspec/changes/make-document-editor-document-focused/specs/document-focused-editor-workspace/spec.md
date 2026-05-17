## ADDED Requirements

### Requirement: Document editor route uses a document-focused workspace
The web app SHALL present `/app/documento/:documentId` as a focused document workspace where the editable document is the primary visual object and administrative dashboard chrome is visually reduced.

#### Scenario: Editable document opens in focused workspace
- **WHEN** an authenticated user opens an editable completed document
- **THEN** the page renders on a very light neutral workspace background
- **AND** the document sheet is centered as the dominant visual element
- **AND** the page does not wrap the editor in a heavy card or nested panel container

#### Scenario: App shell does not compete with the document
- **WHEN** an editable document is open on a desktop viewport
- **THEN** the sidebar and app header are collapsed, minimized, hidden, or otherwise visually deemphasized compared with the document
- **AND** the user still has a clear way to navigate back, preview the document, and save changes

#### Scenario: Narrow viewport keeps document priority
- **WHEN** an editable document is open on a narrow viewport
- **THEN** document controls stack or collapse without overlapping the editable content
- **AND** the document remains the primary content area

### Requirement: Editable sheet looks like a premium institutional document
The editor SHALL render the editable content on a white A4-style sheet with generous internal spacing, subtle depth, near-invisible border treatment, and dynamic height.

#### Scenario: Sheet renders as a document surface
- **WHEN** editable content is loaded
- **THEN** the sheet uses a white background, A4-like proportions, and generous page padding
- **AND** the sheet uses an extremely soft shadow and a border that is visually quieter than the document text
- **AND** the sheet height expands with the editable content instead of clipping the document

#### Scenario: Sheet uses more useful workspace width
- **WHEN** the editor is viewed on a desktop viewport
- **THEN** the document sheet is large enough for comfortable editing and reading
- **AND** the page keeps enough surrounding whitespace to feel like an editorial workspace

### Requirement: Toolbar floats above the document
The editor SHALL provide a minimal floating toolbar above the document sheet rather than a full-width toolbar embedded in a bordered editor card.

#### Scenario: Toolbar appears as a floating control surface
- **WHEN** the editor is ready
- **THEN** formatting controls appear above the sheet in a compact floating toolbar
- **AND** toolbar groups are visually separated by action type
- **AND** toolbar styling is subtle, with small icon-first controls and no heavy panel border

#### Scenario: Toolbar remains accessible
- **WHEN** a user navigates toolbar controls with a mouse, keyboard, or assistive technology
- **THEN** every control has an accessible label
- **AND** active and disabled states remain visible
- **AND** supported Tiptap formatting commands remain available

### Requirement: Administrative metadata is discreet
The editor workspace SHALL keep document metadata available without letting it compete with the document content.

#### Scenario: Metadata appears as secondary context
- **WHEN** an editable document is open
- **THEN** document type, status, related process, responsible person, and updated date are available as compact secondary context
- **AND** metadata does not occupy a right-side card or large dashboard grid beside the document

#### Scenario: Primary actions remain clear
- **WHEN** an editable document is open
- **THEN** back, preview, save, and save-status controls are visible or immediately reachable
- **AND** those controls do not visually overpower the document sheet

### Requirement: Editor typography preserves semantics while improving reading quality
The editor SHALL preserve normalized document semantics and improve screen editing typography so headings, sections, paragraphs, lists, and administrative fields feel like an official document.

#### Scenario: Normalized document content remains semantic
- **WHEN** generated document content is loaded into the editor
- **THEN** titles render as headings, administrative fields render with label/value emphasis, and body text renders as editable document text
- **AND** the editor does not flatten the content into a single paragraph or readonly preview

#### Scenario: Screen typography is refined
- **WHEN** a document contains headings, paragraphs, lists, and blockquotes
- **THEN** the editor uses clear vertical rhythm, comfortable line-height, and restrained title hierarchy
- **AND** the text remains suitable for an institutional document rather than a generic CMS page

### Requirement: Existing editing and export contracts remain unchanged
The visual redesign MUST NOT change the document editing contract, backend persistence contract, or preview/export compatibility.

#### Scenario: User edits and saves content
- **WHEN** a user edits content in the focused workspace and saves
- **THEN** the editor continues to serialize content to the existing persisted `draftContent` format
- **AND** the save request uses the existing document update API behavior

#### Scenario: Saved content is previewed or exported
- **WHEN** saved content is opened in preview or used by export flows
- **THEN** the content remains compatible with the existing preview, PDF, and DOCX rendering expectations
- **AND** editor-only visual styles do not alter print or export output rules
