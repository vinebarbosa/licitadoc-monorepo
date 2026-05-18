## ADDED Requirements

### Requirement: Official preview SHALL render completed documents with Paged.js
The official document preview route SHALL use the Paged.js preview renderer as the primary render surface for completed documents with supported content.

#### Scenario: Completed document has TipTap JSON
- **WHEN** the user opens `/app/documento/:documentId/preview` for a completed document with `draftContentJson`
- **THEN** the page renders the document body through the Paged.js preview renderer
- **AND** the visible document appears as paginated A4 pages
- **AND** the old manual sheet renderer is not shown in parallel

#### Scenario: Completed document has renderable legacy content
- **WHEN** the user opens the official preview for a completed document without `draftContentJson` but with safe `draftContent`
- **THEN** the page renders the legacy content through the supported fallback path
- **AND** the user can still preview and print the document

### Requirement: Official preview SHALL preserve existing operational states
The introduction of Paged.js SHALL NOT remove the existing official preview states for loading, generation in progress, failed generation, empty content, retry, back navigation, and read-only actions.

#### Scenario: Document is still generating
- **WHEN** the document status indicates generation is in progress
- **THEN** the official preview keeps the current generating/live-preview behavior
- **AND** the page does not force the incomplete content through the final Paged.js renderer

#### Scenario: Document generation failed
- **WHEN** the document status indicates a failed generation
- **THEN** the official preview keeps the existing failed state and retry affordance
- **AND** no paginated document body is rendered as if it were final

#### Scenario: Document has no renderable content
- **WHEN** the document has no supported content source
- **THEN** the official preview shows the existing empty or fallback state
- **AND** print/export actions do not produce a misleading blank final document

### Requirement: Official preview SHALL use letterhead as full-page A4 background
When a document exposes `document.letterhead.url`, the official Paged.js preview SHALL apply that image as a full-page background for each generated A4 page.

#### Scenario: Document has organization letterhead
- **WHEN** the official preview renders a document with `document.letterhead.url`
- **THEN** every generated A4 page uses that URL as the page background
- **AND** the background occupies the full A4 sheet
- **AND** the letterhead is not inserted as a flowing image inside the document body

#### Scenario: Letterhead is missing
- **WHEN** the official preview renders a document without a letterhead URL
- **THEN** the document still renders on A4 pages
- **AND** no broken image icon or placeholder image appears in the printable document

### Requirement: Official preview SHALL control printable layout independently of browser margins
The official preview SHALL define A4 size and content area through paged-media CSS so that document layout does not depend on the user choosing a specific browser margin preset.

#### Scenario: Browser print dialog uses default margins
- **WHEN** the user opens browser print with default margins selected
- **THEN** the printable pages preserve the Paged.js A4 layout and letterhead background
- **AND** the document body remains inside the intended useful page area

#### Scenario: Browser print dialog uses no margins
- **WHEN** the user opens browser print with no margins selected
- **THEN** the printable pages still preserve the Paged.js page geometry
- **AND** content does not shift into the physical edge or overlap the letterhead footer/header

### Requirement: Official print and PDF actions SHALL use only generated Paged.js pages
The official "Imprimir" and "Exportar PDF" actions SHALL print the generated paginated output and SHALL hide application UI, preview-only controls, hidden source containers, and duplicate render layers.

#### Scenario: User clicks print
- **WHEN** the user clicks the official print action on a completed paginated document
- **THEN** the system invokes the browser print flow
- **AND** the print output contains only the generated Paged.js pages
- **AND** app navigation, toolbar buttons, shadows, preview background, and hidden source content are not printed

#### Scenario: User exports PDF
- **WHEN** the user clicks "Exportar PDF"
- **THEN** the system uses the same printable paginated output as the print action
- **AND** the browser Save as PDF result matches the official preview pages

### Requirement: Official preview SHALL avoid duplicate pages and duplicate fixed layers
The Paged.js integration SHALL clean previous render output before each rerender and SHALL avoid duplicate page backgrounds, duplicate generated pages, duplicated fixed elements, and duplicated body content.

#### Scenario: Document content rerenders
- **WHEN** the document content, letterhead URL, or layout key changes after the initial preview render
- **THEN** the previous Paged.js output is cleared before the new render is inserted
- **AND** the preview shows only one current set of pages

#### Scenario: User opens print after rerender
- **WHEN** the user opens print after the preview has rerendered one or more times
- **THEN** the print output contains one copy of each page
- **AND** no hidden fixed markers, source wrappers, or duplicated letterhead layers appear

### Requirement: Official preview SHALL preserve the Paged.js laboratory page
The isolated Paged.js demo page SHALL remain available as a visual regression surface while the official preview migration is validated.

#### Scenario: Developer opens the demo route
- **WHEN** a developer opens the existing Paged.js demo route
- **THEN** the route continues to render the mock multi-page document
- **AND** it uses the same core paged-preview module as the official preview
