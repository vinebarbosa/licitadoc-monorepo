## ADDED Requirements

### Requirement: Documents list name links MUST open document preview
The documents listing page MUST make each document name link navigate to the registered document preview route for that document. The primary document-name link MUST NOT navigate to the missing `/app/documento/:documentId` route.

#### Scenario: Document name opens preview
- **WHEN** an authenticated actor views the documents listing with document id `document-1`
- **THEN** the `document-1` name link points to `/app/documento/document-1/preview`
- **AND** activating the name link opens the preview route

#### Scenario: Document name avoids missing route
- **WHEN** an authenticated actor views the documents listing with document id `document-1`
- **THEN** the primary document-name link does not point to `/app/documento/document-1`

#### Scenario: Visualizar remains aligned with preview
- **WHEN** an authenticated actor opens the document row actions for document id `document-1`
- **THEN** the `Visualizar` action points to `/app/documento/document-1/preview`
