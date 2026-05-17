## ADDED Requirements

### Requirement: Document edit route MUST be available inside the protected app
The web app MUST expose `/app/documento/:documentId` as an authenticated route in the app shell. Document edit links MUST navigate to this route when a document id is available, while explicit preview links MUST continue to navigate to `/app/documento/:documentId/preview`.

#### Scenario: User opens editor from documents listing
- **WHEN** an authenticated user activates the document name or edit action for a listed document with id `document-1`
- **THEN** the app navigates to `/app/documento/document-1`
- **AND** the page renders inside the protected app shell

#### Scenario: User opens preview from documents listing
- **WHEN** an authenticated user activates the "Visualizar" action for a listed document with id `document-1`
- **THEN** the app navigates to `/app/documento/document-1/preview`
- **AND** the read-only preview page remains available

#### Scenario: Unauthenticated user opens edit route
- **WHEN** a user without an authenticated session opens `/app/documento/document-1`
- **THEN** the app applies the same protected-route behavior used by other `/app` pages

### Requirement: Document editor page MUST load document detail and gate editing by lifecycle state
The editor page MUST request document detail for the route `documentId` and display document name, type, status, related process reference, responsibles, updated timestamp, and current draft content when the document is editable. A document MUST be editable only when its detail response has status `completed` and non-empty `draftContent`.

#### Scenario: Completed document with content opens in editor
- **WHEN** an authenticated user opens the edit route for a completed document whose detail response includes non-empty `draftContent`
- **THEN** the page displays the document metadata
- **AND** the Tiptap editor is initialized with the persisted draft content

#### Scenario: Document is still generating
- **WHEN** the document detail status is `generating`
- **THEN** the page shows a non-editable generation state
- **AND** the page does not mount an empty editor as if content were ready

#### Scenario: Document generation failed
- **WHEN** the document detail status is `failed`
- **THEN** the page shows a non-editable failure state
- **AND** the page offers a safe way back to documents or preview context when available

#### Scenario: Completed document has no draft content
- **WHEN** the document detail status is `completed` and `draftContent` is empty or null
- **THEN** the page shows an explicit empty-content state
- **AND** the page does not create editable content silently

### Requirement: Document editor experience MUST feel institutional, clear, and safe
The editor page MUST present a mature institutional editing surface with a stable command bar, explicit save status, focused formatting controls, document metadata context, and a document canvas aligned with the existing preview visual language. The page MUST avoid marketing-style hero content, generic template copy, decorative backgrounds, and nested card-heavy composition.

#### Scenario: Editable document shows the premium editor shell
- **WHEN** an editable document is loaded
- **THEN** the page shows a back action, preview action, save action, save-status indicator, formatting toolbar, document canvas, and document metadata context
- **AND** the visible experience is focused on editing the document rather than explaining the product

#### Scenario: User needs confidence before leaving
- **WHEN** the document has unsaved edits
- **THEN** the page clearly indicates that changes are unsaved
- **AND** navigation or browser unload prompts the user before discarding those edits

### Requirement: Tiptap editor MUST support the core procurement document formatting workflow
The editor MUST use Tiptap for rich-text editing and MUST support the formatting needed for generated procurement drafts, including headings, paragraphs, bold, italic, underline, bullet lists, numbered lists, blockquotes, links, undo, and redo. The editor MUST preserve the persisted Markdown-like `draftContent` format when saving.

#### Scenario: User formats document content
- **WHEN** a user selects text and activates a supported formatting control
- **THEN** the editor applies the formatting through Tiptap
- **AND** the toolbar reflects the active formatting state when that state is selected

#### Scenario: User saves formatted content
- **WHEN** a user saves a document that includes headings, paragraphs, emphasis, and lists
- **THEN** the saved `draftContent` preserves those structures in the canonical persisted format
- **AND** the preview page can render the saved content without requiring a different document format

### Requirement: API MUST persist full document draft edits within actor scope
The API MUST allow authorized actors to update a completed document's `draftContent` through a full-document update contract scoped by the document organization. The update MUST preserve document id, organization id, process id, type, and generation status, MUST update `updatedAt`, and MUST return the updated document detail.

#### Scenario: Authorized actor saves a completed document
- **WHEN** an authenticated actor with permission over the document submits updated `draftContent` and the current `sourceContentHash`
- **THEN** the system persists the new draft content
- **AND** the response returns the updated document detail with a newer `updatedAt`

#### Scenario: Organization-scoped actor saves another organization's document
- **WHEN** an authenticated `organization_owner` or `member` submits an update for a document whose organization differs from the actor's organization
- **THEN** the system rejects the request
- **AND** the stored draft content remains unchanged

#### Scenario: User attempts to save a non-completed document
- **WHEN** an authenticated actor submits an update for a document whose status is `generating` or `failed`
- **THEN** the system rejects the request
- **AND** the stored draft content remains unchanged

#### Scenario: User attempts to save over stale content
- **WHEN** an authenticated actor submits an update with a `sourceContentHash` that does not match the current stored draft content
- **THEN** the system rejects the request with a conflict response
- **AND** the stored draft content remains unchanged

### Requirement: Editor save flow MUST give reliable feedback and preserve user work on failure
The web editor MUST expose save, saving, saved, unsaved, conflict, and error states. Successful saves MUST refresh or update the document detail cache. Failed saves MUST keep the user's current editor content intact and provide a retry path.

#### Scenario: User saves successfully
- **WHEN** a user edits a completed document and activates Save
- **THEN** the page sends the updated content to the document update API
- **AND** the page updates the visible save status to saved after the API succeeds
- **AND** the page no longer treats the document as dirty

#### Scenario: Save fails with server or network error
- **WHEN** a user edits a document and the save request fails with a retryable error
- **THEN** the page keeps the edited content in the editor
- **AND** the page shows a save error state with a retry path

#### Scenario: Save fails because content is stale
- **WHEN** a user edits a document and the save request returns a stale-content conflict
- **THEN** the page keeps the edited content in the editor
- **AND** the page explains that the stored document changed before this save completed

### Requirement: Saved edits MUST remain visible in preview
After a successful edit save, the read-only preview route MUST render the updated persisted content for the same document without requiring a separate migration or preview-specific data source.

#### Scenario: User previews saved edits
- **WHEN** a user successfully saves edits on `/app/documento/document-1`
- **AND** the user opens `/app/documento/document-1/preview`
- **THEN** the preview page renders the updated draft content
- **AND** the preview actions remain available according to the existing preview behavior
