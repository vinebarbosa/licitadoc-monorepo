## MODIFIED Requirements

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings and detail reads MUST expose the document type and generation status, and detail reads MUST include the current draft content when generation has completed. Detail reads for completed documents MUST expose an editor-ready Tiptap JSON representation of the current draft content. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, the stored draft content, and the editor-ready Tiptap JSON draft content

#### Scenario: Completed document only has legacy text content
- **WHEN** an authenticated actor with visibility over a completed document requests detail for a document that has stored draft text but no stored Tiptap JSON
- **THEN** the system returns a derived Tiptap JSON draft content representation suitable for initializing the editor

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each document's type and generation status in the list response

## ADDED Requirements

### Requirement: API MUST persist full document JSON draft edits within actor scope
The API MUST allow authorized actors to update a completed document's Tiptap JSON draft content through a full-document update contract scoped by the document organization. The update MUST preserve document id, organization id, process id, type, and generation status, MUST update `updatedAt`, MUST keep a compatibility text representation in sync for preview/export flows, and MUST return the updated document detail.

#### Scenario: Authorized actor saves a completed document
- **WHEN** an authenticated actor with permission over the document submits updated Tiptap JSON draft content and the current `sourceContentHash`
- **THEN** the system persists the new JSON draft content
- **AND** the response returns the updated document detail with a newer `updatedAt`

#### Scenario: Saved JSON remains preview-compatible
- **WHEN** an authenticated actor saves updated Tiptap JSON draft content
- **THEN** the system updates the compatibility text draft content from the saved JSON
- **AND** preview/export flows can read the updated draft without requiring a separate JSON renderer

#### Scenario: Organization-scoped actor saves another organization's document
- **WHEN** an authenticated `organization_owner` or `member` submits an update for a document whose organization differs from the actor's organization
- **THEN** the system rejects the request
- **AND** the stored draft content remains unchanged

#### Scenario: User attempts to save a non-completed document
- **WHEN** an authenticated actor submits an update for a document whose status is `generating` or `failed`
- **THEN** the system rejects the request
- **AND** the stored draft content remains unchanged

#### Scenario: User attempts to save over stale content
- **WHEN** an authenticated actor submits an update with a `sourceContentHash` that does not match the current editor JSON source content
- **THEN** the system rejects the request with a conflict response
- **AND** the stored draft content remains unchanged
