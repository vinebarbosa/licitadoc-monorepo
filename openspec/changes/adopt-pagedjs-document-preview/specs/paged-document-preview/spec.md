## ADDED Requirements

### Requirement: Document preview SHALL render HTML content into A4 pages with Paged.js
The system SHALL provide a React document preview surface that renders source HTML/React content through Paged.js into real A4 pages. The source content SHALL be rendered inside a hidden `#paged-root` container containing `.page-content`, and the generated pages SHALL be rendered into a separate visible preview container.

#### Scenario: Completed document renders as paginated preview
- **WHEN** a completed document has renderable HTML or TipTap-derived content
- **THEN** the preview renders the content through Paged.js into visible A4 pages
- **AND** the source `#paged-root .page-content` remains hidden from the user
- **AND** the user does not see duplicated source and paginated content

#### Scenario: Content changes after initial render
- **WHEN** the document content or layout inputs change
- **THEN** the preview clears the previous Paged.js output before rendering again
- **AND** the visible page list reflects the latest content without duplicated pages

### Requirement: Paged preview SHALL expose reusable typed React components
The system SHALL provide reusable TypeScript components for paged document rendering, including `DocumentPreview`, `PaperLayout`, `PageHeader`, `PageFooter`, and an optional watermark component. These components SHALL be usable by document preview flows and by an isolated example.

#### Scenario: DocumentPreview composes paper layout
- **WHEN** a caller renders `DocumentPreview` with document content and institutional layout data
- **THEN** the component uses `PaperLayout`, `PageHeader`, and `PageFooter` to define the printable document structure
- **AND** the caller can enable or disable watermark rendering

#### Scenario: Example preview renders without process data
- **WHEN** the example component is opened with mock document data
- **THEN** it renders a full multi-page preview with logo, header, footer, body content, tables, lists, and signature
- **AND** it does not require an API response to demonstrate the paged layout

### Requirement: Paged preview SHALL repeat institutional header and footer on every page
The generated pages SHALL repeat institutional header and footer content automatically across all pages. The footer SHALL support page numbering using paged media counters.

#### Scenario: Long document spans multiple pages
- **WHEN** content spans more than one A4 page
- **THEN** each generated page displays the configured institutional header
- **AND** each generated page displays the configured institutional footer
- **AND** page numbering appears on each page where enabled

#### Scenario: Header/footer data is missing
- **WHEN** optional header or footer fields are absent
- **THEN** the preview omits or uses neutral placeholders for those fields according to component props
- **AND** the document body does not contain explanatory metalinguagem about missing data

### Requirement: Paged preview SHALL support professional print and PDF export
The preview SHALL provide print-specific CSS for clean browser printing and a visible "Exportar PDF" action that invokes `window.print()`. The printed output SHALL hide app chrome and preview-only controls while preserving the paginated pages.

#### Scenario: User exports PDF from preview
- **WHEN** the user clicks "Exportar PDF"
- **THEN** the system invokes `window.print()`
- **AND** the browser print output contains the paginated document pages without app navigation or action controls

#### Scenario: Browser print uses A4 settings
- **WHEN** the user opens browser print for the paged preview
- **THEN** print CSS declares A4 page size and professional margins
- **AND** the document pages preserve header, footer, page numbering, body content, images, and watermark where configured

### Requirement: Paged preview SHALL define print and screen styles for formal documents
The system SHALL provide dedicated CSS for Paged.js pages. Screen preview SHALL show page shadows and spacing between pages, while print output SHALL remove screen decoration. The CSS SHALL include `@page { size: A4; margin: 20mm; }` as the base paged-media contract.

#### Scenario: User views preview on screen
- **WHEN** the paged preview is rendered in the web app
- **THEN** each page appears as a white A4 sheet with restrained shadow and spacing between pages
- **AND** the layout visually resembles a Word/Google Docs document preview

#### Scenario: User prints the preview
- **WHEN** print media rules apply
- **THEN** page shadows, page gaps, toolbars, and screen-only decorations are not printed
- **AND** the printed document uses the paged-media page size and margins

### Requirement: Paged preview SHALL support rich document content
The paged preview SHALL support rich document content generated from TipTap or safe React/HTML, including headings, paragraphs, lists, images, tables, signatures, and long sections. Tables and important blocks SHALL use print-aware break rules to reduce awkward splits.

#### Scenario: Document contains tables and lists
- **WHEN** the source content contains long tables and nested lists
- **THEN** the paged preview keeps the content within the page width
- **AND** table headers, rows, list markers, and paragraph formatting remain readable across pages

#### Scenario: Document contains images and signature blocks
- **WHEN** the source content contains images or signature sections
- **THEN** images scale within the usable page width
- **AND** signature blocks avoid being split awkwardly where CSS and Paged.js support it

### Requirement: Paged preview SHALL manage Paged.js lifecycle safely
The React integration SHALL prevent memory leaks, stale renders, and duplicate pages. It SHALL clean generated output on rerender and unmount, guard asynchronous rendering, and expose render status to the UI.

#### Scenario: Component unmounts during rendering
- **WHEN** the paged preview component unmounts while Paged.js is still rendering
- **THEN** the hook prevents stale render completion from mutating unmounted React-owned state
- **AND** generated DOM owned by the preview is cleaned up

#### Scenario: Multiple rapid updates occur
- **WHEN** content changes multiple times in quick succession
- **THEN** older render attempts are ignored or superseded
- **AND** only the latest content appears in the visible paged preview

### Requirement: Paged preview SHALL preserve existing document preview states
The introduction of Paged.js SHALL NOT remove existing loaded, loading, generation, failed, empty-content, and read-only preview behaviors. Paged.js SHALL be used for completed renderable documents, while unsupported or legacy content SHALL keep a safe fallback path.

#### Scenario: Document is still generating
- **WHEN** a document is in generating state
- **THEN** the existing live preview/generation state remains available
- **AND** the system does not attempt to paginate incomplete content unless explicitly supported

#### Scenario: Legacy content cannot be safely paginated
- **WHEN** a completed document lacks a supported HTML/TipTap source for Paged.js
- **THEN** the preview falls back to the existing safe document renderer
- **AND** print/export actions remain governed by the existing preview eligibility rules
