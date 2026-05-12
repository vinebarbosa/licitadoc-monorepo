## ADDED Requirements

### Requirement: Document preview MUST use the validated document-sheet layout
The protected document preview page MUST present completed previewable documents using a document-sheet layout adapted from `tmp/documento-preview.tsx` while remaining implemented inside the supported `apps/web` architecture.

#### Scenario: Completed document preview is displayed
- **WHEN** an authenticated user opens `/app/documento/:documentId/preview` for a completed document with previewable content
- **THEN** the page renders a centered document preview card with official-style header, separators, object/process context, content body, and footer/signature affordance
- **AND** the page uses real document detail data rather than mock data from `tmp`
- **AND** no runtime import from `tmp` is required

#### Scenario: Preview adapts on narrow viewports
- **WHEN** the document preview is rendered on a narrow viewport
- **THEN** the action row and document sheet remain readable without horizontal page overflow

### Requirement: Document preview MUST expose validated action controls
The protected document preview page MUST expose the validated preview actions for returning to the document workflow, printing, exporting DOCX, and exporting PDF.

#### Scenario: User inspects preview actions
- **WHEN** the document preview page is rendered
- **THEN** a return action is available
- **AND** print, DOCX export, and PDF export controls are visible in the preview action row

#### Scenario: Export integration is unavailable
- **WHEN** a backend export contract is not available for an export control
- **THEN** the control does not perform a fake download
- **AND** the unavailable behavior is represented through a disabled, pending, or otherwise non-misleading UI state

### Requirement: Document preview MUST preserve existing data-backed states
Adopting the validated UI MUST preserve the existing document preview data flow and states for loading, retryable errors, forbidden/not-found responses, generation in progress, generation failure, and completed documents without content.

#### Scenario: Document detail is loading
- **WHEN** the document detail request is pending
- **THEN** the page renders a loading state that is visually consistent with the validated document-sheet layout

#### Scenario: Document detail fails with retryable error
- **WHEN** the detail request fails with a retryable server or network error
- **THEN** the page renders a retryable error state
- **AND** activating retry requests the document detail again

#### Scenario: Document is generating
- **WHEN** the document status is `generating`
- **THEN** the page communicates that the preview is not ready
- **AND** the page does not render an empty document sheet as successful content

#### Scenario: Completed document has no previewable content
- **WHEN** the document status is `completed` and `draftContent` is empty or null
- **THEN** the page renders an explicit empty-content state
- **AND** the page keeps navigation back to the documents workflow available

### Requirement: Document preview MUST keep safe Markdown rendering
The validated document preview body MUST continue rendering stored `draftContent` as safe Markdown.

#### Scenario: Completed Markdown content is shown inside the document sheet
- **WHEN** a completed document includes Markdown headings, paragraphs, lists, tables, and links in `draftContent`
- **THEN** the document sheet renders those elements semantically inside the content body
- **AND** the validated document chrome surrounds the rendered content

#### Scenario: Stored Markdown contains unsafe content
- **WHEN** stored `draftContent` includes raw script HTML or unsafe URL schemes
- **THEN** the preview does not execute scripts or navigate through unsafe schemes
- **AND** the rest of the document body remains readable
