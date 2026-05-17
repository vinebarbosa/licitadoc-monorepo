## MODIFIED Requirements

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings and detail reads MUST expose the document type and generation status, and detail reads MUST include the current draft content when generation has completed. Detail reads for completed documents MUST expose the editor-ready TipTap JSON draft content whenever it exists or can be derived safely, so both the protected editor and completed preview can render the same document structure. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, the stored draft content, and the editor-ready TipTap JSON draft content

#### Scenario: Completed document has saved JSON content
- **WHEN** an authenticated actor with visibility over a completed document requests detail for a document whose current draft has saved TipTap JSON
- **THEN** the system returns that saved TipTap JSON as `draftContentJson`
- **AND** the returned JSON reflects the current saved editor state used by preview and editing flows

#### Scenario: Completed document only has legacy text content
- **WHEN** an authenticated actor with visibility over a completed document requests detail for a document that has stored draft text but no stored TipTap JSON
- **THEN** the system returns a derived TipTap JSON draft content representation suitable for initializing the editor and completed preview
- **AND** the original text draft content remains available for compatibility flows

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each document's type and generation status in the list response
