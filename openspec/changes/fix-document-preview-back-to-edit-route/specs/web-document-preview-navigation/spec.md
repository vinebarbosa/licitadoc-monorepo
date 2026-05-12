## ADDED Requirements

### Requirement: Document preview back action MUST use an existing route
The document preview page MUST expose a back/navigation action that links only to a route registered by the web app. When no dedicated document editing route exists, the action MUST navigate to the documents listing and MUST use copy that reflects that destination.

#### Scenario: Preview action returns to documents listing
- **WHEN** an authenticated actor opens a document preview
- **THEN** the primary back action links to `/app/documentos`
- **AND** the action label communicates that it returns to documents rather than document editing

#### Scenario: Preview action avoids missing edit route
- **WHEN** an authenticated actor opens a document preview for document id `document-1`
- **THEN** no preview navigation action links to `/app/documento/document-1` unless that route is registered by the app
