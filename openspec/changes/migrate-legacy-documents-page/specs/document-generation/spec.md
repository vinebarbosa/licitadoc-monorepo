## MODIFIED Requirements

### Requirement: Generated document reads MUST expose draft type, status, and content within organization scope
The system MUST allow authorized actors to list and read generated documents. Document listings MUST expose the document type, generation status, process context needed by the web documents page, responsible summary data, and last-update metadata for each visible document. Detail reads MUST include the current draft content when generation has completed. `admin` actors MUST be able to read documents across organizations. `organization_owner` and `member` actors MUST be limited to documents inside their own organization.

#### Scenario: Authorized actor reads a completed generated document
- **WHEN** an authenticated actor with visibility over the document requests its detail after generation completed
- **THEN** the system returns the document type, generation status, parent `processId`, and the stored draft content

#### Scenario: Organization-scoped actor reads a document from another organization
- **WHEN** an authenticated `organization_owner` or `member` requests a generated document whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Authorized actor lists generated documents with page-ready context
- **WHEN** an authenticated actor requests the document listing
- **THEN** the system returns only documents visible to that actor and includes each item's document type, generation status, process context required by the documents page, responsible summary data, and update timestamps in the list response