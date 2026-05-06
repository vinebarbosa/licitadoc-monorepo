## ADDED Requirements

### Requirement: Document preview route MUST be available inside the protected app
The web app MUST expose `/app/documento/:documentId/preview` as an authenticated route in the app shell. Existing document "Visualizar" links from the documents workflow MUST navigate to this route when a document id is available.

#### Scenario: User opens preview from documents listing
- **WHEN** an authenticated user activates the "Visualizar" action for a listed document with id `document-1`
- **THEN** the app navigates to `/app/documento/document-1/preview`
- **AND** the page renders inside the protected app shell

#### Scenario: Unauthenticated user opens preview route
- **WHEN** a user without an authenticated session opens `/app/documento/document-1/preview`
- **THEN** the app applies the same protected-route behavior used by other `/app` pages

### Requirement: Document preview page MUST load and display document details
The preview page MUST request the document detail for the route `documentId` and display the document name, type, generation status, related process reference when available, responsible summary, updated timestamp, and stored draft content when the document has previewable content.

#### Scenario: Completed document with content is displayed
- **WHEN** an authenticated user opens the preview route for a completed document whose detail response includes `draftContent`
- **THEN** the page shows the document metadata
- **AND** the stored draft content is rendered as read-only preview content
- **AND** line breaks from the stored content remain readable in the preview

#### Scenario: Document links to a process
- **WHEN** the document detail includes `processId`
- **THEN** the preview page provides a link to `/app/processo/:processId`
- **AND** the visible process reference uses `processNumber` when it is available

### Requirement: Document preview page MUST handle loading and failure states
The preview page MUST provide explicit states for loading, retryable API errors, not found or forbidden responses, generation in progress, generation failure, and completed documents without stored content.

#### Scenario: Detail request is loading
- **WHEN** the document detail request is pending
- **THEN** the page shows a loading state that preserves the document-preview page layout

#### Scenario: Detail request fails with retryable error
- **WHEN** the document detail request fails with a retryable server or network error
- **THEN** the page shows an error state with a retry action
- **AND** activating retry requests the document detail again

#### Scenario: Detail request is forbidden or not found
- **WHEN** the document detail request returns a forbidden or not found response
- **THEN** the page shows a non-retryable unavailable-document state
- **AND** the page offers navigation back to the documents listing

#### Scenario: Document is still generating
- **WHEN** the document detail status is `generating`
- **THEN** the page explains that the preview is not ready yet
- **AND** the page keeps the document metadata visible

#### Scenario: Document generation failed
- **WHEN** the document detail status is `failed`
- **THEN** the page explains that the document generation failed
- **AND** the page does not render an empty preview as if it were successful content

#### Scenario: Completed document has no draft content
- **WHEN** the document detail status is `completed` and `draftContent` is empty or null
- **THEN** the page shows an explicit empty-content state
- **AND** the page keeps navigation back to documents available
