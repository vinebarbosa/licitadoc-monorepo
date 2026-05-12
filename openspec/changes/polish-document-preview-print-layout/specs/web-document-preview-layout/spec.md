## ADDED Requirements

### Requirement: Document preview uses a formal sheet layout
The web document preview SHALL render available document content inside a formal document sheet that visually resembles a printable page instead of a generic application card.

#### Scenario: Completed document renders on a page surface
- **WHEN** a completed document with previewable draft content is opened
- **THEN** the content is displayed inside a centered document sheet with page-like width, padding, background, and screen-only decoration
- **AND** the body content is not styled as a quoted note or secondary panel

#### Scenario: Generating document renders live content on the same surface
- **WHEN** a generating document has live preview content
- **THEN** the live content is displayed inside the same formal document sheet used by completed documents
- **AND** the generation status indicator does not visually replace or obscure the document body

### Requirement: Document preview avoids misleading synthetic document content
The web document preview MUST NOT inject UI-only document clauses, placeholders, or duplicate formal sections that can be mistaken for generated document content.

#### Scenario: Missing organization metadata is unavailable
- **WHEN** the document detail response does not provide real organization or requesting-unit text
- **THEN** the document sheet does not display hardcoded "Órgão não informado" or "Unidade requisitante não informada" placeholders

#### Scenario: Generated Markdown already contains the formal title
- **WHEN** the generated Markdown contains the document title or primary heading
- **THEN** the preview does not add a second formal title above the Markdown body

#### Scenario: Generated Markdown owns object and signature content
- **WHEN** the generated Markdown contains the document body
- **THEN** the preview does not add an artificial `OBJETO` section using `document.name`
- **AND** the preview does not append an extra responsible/signature footer outside the Markdown body

### Requirement: Document Markdown uses formal document typography
The web document preview SHALL render Markdown elements with typography suitable for formal generated documents while preserving safe Markdown behavior.

#### Scenario: Formal headings and paragraphs render
- **WHEN** the preview content contains headings and paragraphs
- **THEN** headings use clear document section spacing and hierarchy
- **AND** paragraphs remain readable with formal line height and alignment

#### Scenario: Tables and lists render in a document body
- **WHEN** the preview content contains GFM tables, ordered lists, or unordered lists
- **THEN** those elements render with consistent spacing, borders, and wrapping appropriate for document review
- **AND** wide tables remain inspectable on screen without breaking the page layout

#### Scenario: Unsafe Markdown content remains blocked
- **WHEN** the preview content contains unsafe links or raw HTML-like content
- **THEN** the renderer continues to avoid executing unsafe content
- **AND** safe Markdown links continue to render as links

### Requirement: Document preview supports clean browser printing
The web document preview SHALL provide print-specific styling that prints the document content cleanly without application chrome or preview controls.

#### Scenario: User prints a previewed document
- **WHEN** the user invokes browser printing from the preview page
- **THEN** preview actions, app navigation, and non-document chrome are hidden from the printed output
- **AND** the printed page uses clean document margins without screen shadows or card decoration

#### Scenario: Printed document contains structured content
- **WHEN** the document body includes headings, paragraphs, lists, or tables
- **THEN** print styling minimizes awkward breaks around those structures where CSS can control it
- **AND** the document content remains readable on the printed page

### Requirement: Live writing auto-follow remains intact
The web document preview SHALL preserve existing live-writing auto-follow behavior after the visual layout changes.

#### Scenario: Live document receives additional visible content
- **WHEN** a generating document receives new visible document text
- **THEN** the preview continues following the bottom of the rendered document while the user remains near the live-writing position

#### Scenario: User scrolls away during live writing
- **WHEN** the user scrolls away from the live-writing position during generation
- **THEN** the preview does not force-scroll back until the user returns near the live-writing position
