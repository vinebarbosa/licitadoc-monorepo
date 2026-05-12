## ADDED Requirements

### Requirement: Document preview MUST omit standalone metadata summary cards
The protected document preview page MUST NOT render a standalone summary card that presents the generated document title, process/code metadata, or last-updated metadata outside the validated document layout.

#### Scenario: Completed document has previewable content
- **WHEN** an authenticated user opens a completed document preview with stored content
- **THEN** the page renders the top action row followed by the validated document layout
- **AND** no separate title/process/last-update summary card appears above the document layout

#### Scenario: Document has no previewable content
- **WHEN** the document preview is in generating, failed, or empty-content state
- **THEN** the page renders the top action row followed by the relevant state content
- **AND** no separate title/process/last-update summary card appears above the state content

### Requirement: Document preview MUST preserve top actions and existing states
Removing the summary card MUST preserve the top action row and the existing loading, retryable error, forbidden/not-found, generating, failed, empty-content, and completed-content behavior.

#### Scenario: User inspects preview actions
- **WHEN** the document preview page renders any loaded document state
- **THEN** the return, print, DOCX export, and PDF export controls remain visible above the document or state content

#### Scenario: Preview state is not completed content
- **WHEN** the document is generating, failed, or completed without previewable content
- **THEN** the existing state message remains visible
- **AND** the page does not show successful document content as a substitute for the removed summary card
