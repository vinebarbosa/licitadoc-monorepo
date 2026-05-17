## ADDED Requirements

### Requirement: Documents MUST paginate automatically by rendered page height
The document editor and completed JSON preview MUST automatically create visual page boundaries when rendered document content exceeds the usable height of a page. Automatic page boundaries MUST be derived from measured layout and MUST NOT require users or generators to insert manual page-break nodes for normal overflow.

#### Scenario: Long document overflows the first page
- **WHEN** a document contains enough rendered content to exceed the usable height of one page
- **THEN** the editor renders the overflowing content on a subsequent visual page
- **AND** the user sees background space between the pages

#### Scenario: Preview opens the same long document
- **WHEN** the same saved TipTap JSON document is opened in completed preview
- **THEN** the preview renders automatic page boundaries at the same content positions as the editor for the same layout width and page settings
- **AND** the preview does not require persisted automatic page-break nodes in `draftContentJson`

### Requirement: Pagination MUST preserve a single canonical TipTap document
The system MUST keep `draftContentJson` as one canonical TipTap document while automatic pagination remains a derived presentation layer. Automatic page boundaries MUST NOT be written into saved JSON as structural content.

#### Scenario: User saves an automatically paginated document
- **WHEN** a user edits a long document that displays multiple automatic pages and saves it
- **THEN** the saved JSON contains the document content without generated automatic page-break nodes
- **AND** reopening the editor recalculates the visual pages from the saved content

#### Scenario: User edits near an automatic page boundary
- **WHEN** a user types, deletes, formats, or applies an AI replacement near an automatic page boundary
- **THEN** the edit applies to the underlying TipTap document normally
- **AND** pagination recalculates without corrupting selection, undo history, or saved JSON

### Requirement: Pages MUST render as distinct document sheets
The editor and completed preview MUST render each computed page as a distinct visual sheet with the validated page width, margins, white surface, border, shadow, and workspace background between sheets.

#### Scenario: Multiple pages are visible
- **WHEN** automatic pagination produces more than one page
- **THEN** each page appears as its own sheet
- **AND** the area between pages uses the workspace background rather than a white connector

#### Scenario: User changes zoom or viewport width
- **WHEN** page width, zoom, viewport size, or font layout changes
- **THEN** the sheet geometry and page boundaries are recalculated
- **AND** text remains within the page surface without horizontal overflow

### Requirement: Manual page breaks MUST act as forced page boundaries
Persisted manual page-break representations MUST continue to work as forced page boundaries in both editor and preview. Manual page breaks MUST be compatible with automatic pagination and MUST NOT be required for ordinary page overflow.

#### Scenario: Document contains a manual page break
- **WHEN** a TipTap JSON document contains the existing manual page-break representation
- **THEN** the editor starts following content on a new visual page at that position
- **AND** automatic pagination continues before and after the manual break as needed

#### Scenario: Preview renders a saved manual page break
- **WHEN** a saved document with a manual page break is opened in preview
- **THEN** the preview shows a page boundary at the manual break position
- **AND** the boundary visually matches automatic page gaps

### Requirement: Pagination MUST recalculate from layout changes
The pagination layer MUST recalculate when document content, block dimensions, page dimensions, zoom, viewport width, loaded fonts, or visible editor/preview container dimensions change.

#### Scenario: User adds enough content to create a new page
- **WHEN** a user types or inserts content that causes the current page to overflow
- **THEN** a new page boundary appears without requiring a full page reload
- **AND** following content moves onto the next visual page

#### Scenario: User removes content from a page
- **WHEN** a user deletes content so a later block can fit on an earlier page
- **THEN** the pagination layer removes or moves the affected automatic page boundary
- **AND** page count updates to reflect the current rendered content

### Requirement: Editing and AI selection MUST work across paginated content
Automatic pagination MUST preserve existing editor interactions, including text selection, keyboard navigation, formatting commands, list indentation, AI improvement prompts, suggestion application, undo/redo, save shortcuts, and preview text-adjustment selection.

#### Scenario: User selects text across visible page content
- **WHEN** a user selects text in automatically paginated editor or preview content
- **THEN** the system captures the selected text and context from the underlying document
- **AND** pagination controls or page gaps do not become part of the selected document text

#### Scenario: AI applies a replacement near a page boundary
- **WHEN** the user accepts an AI replacement for text near an automatic page boundary
- **THEN** the replacement updates the TipTap document content
- **AND** automatic pagination recalculates after the replacement is applied

### Requirement: Printing MUST respect computed page boundaries
When printing a paginated preview, the system MUST map computed page boundaries to browser print page breaks where supported, while excluding screen-only page chrome and editor controls from document content.

#### Scenario: User prints a multi-page preview
- **WHEN** a user prints a completed preview with automatic page boundaries
- **THEN** browser print starts each computed visual page on a new printed page where supported
- **AND** workspace gaps, shadows, rulers, toolbars, and editor-only controls are not printed as document content
