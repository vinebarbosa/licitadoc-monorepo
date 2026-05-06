## ADDED Requirements

### Requirement: Document preview MUST render stored Markdown
The document preview page MUST render completed document `draftContent` as Markdown rather than plain preformatted text. The rendered preview MUST support headings, paragraphs, emphasis, ordered and unordered lists, blockquotes, inline code, fenced code blocks, links, and GitHub Flavored Markdown tables.

#### Scenario: Completed Markdown document is displayed with structure
- **WHEN** an authenticated user opens a completed document preview whose `draftContent` contains Markdown headings, paragraphs, lists, and emphasis
- **THEN** the preview renders semantic heading, paragraph, list, and emphasis elements
- **AND** the user does not see the Markdown control characters as the primary presentation

#### Scenario: Completed document contains Markdown table
- **WHEN** a completed document preview includes a GitHub Flavored Markdown table
- **THEN** the preview renders a readable table
- **AND** the table remains usable on narrow viewports without breaking the page layout

### Requirement: Document preview Markdown MUST be rendered safely
The Markdown renderer MUST treat stored `draftContent` as untrusted content. The preview MUST NOT execute raw HTML, script tags, inline event handlers, iframes, or dangerous URL schemes from the stored Markdown.

#### Scenario: Stored Markdown contains raw script HTML
- **WHEN** a completed document preview includes raw HTML such as a script tag in `draftContent`
- **THEN** the script is not executed
- **AND** the preview does not create an executable script element in the document

#### Scenario: Stored Markdown contains an unsafe link
- **WHEN** a completed document preview includes a link with an unsafe URL scheme
- **THEN** the preview does not navigate through the unsafe scheme
- **AND** the rest of the Markdown content remains readable

### Requirement: Markdown rendering MUST preserve existing preview states
Markdown rendering MUST only affect the completed-document content presentation. The preview page MUST keep the existing loading, retryable error, forbidden/not found, generating, failed, and empty-content states.

#### Scenario: Document has no previewable content
- **WHEN** the document detail status is `completed` and `draftContent` is empty or null
- **THEN** the page shows the existing empty-content state instead of mounting the Markdown renderer

#### Scenario: Document generation is still pending
- **WHEN** the document detail status is `generating`
- **THEN** the page shows the existing generation-in-progress state
- **AND** Markdown rendering is not attempted
