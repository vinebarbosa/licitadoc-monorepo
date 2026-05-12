## ADDED Requirements

### Requirement: Document preview back action MUST navigate through history
The document preview page MUST expose a back action that returns to the previous in-app history entry when one is available. The action MUST use neutral copy because the destination depends on the user's navigation path.

#### Scenario: User arrived from another in-app page
- **WHEN** an authenticated actor opens a document preview after navigating from another in-app page
- **THEN** clicking the preview back action navigates back to the previous history entry
- **AND** the action label is `Voltar`

#### Scenario: User opened preview directly
- **WHEN** an authenticated actor opens a document preview without a usable previous in-app history entry
- **THEN** clicking the preview back action navigates to `/app/documentos`
- **AND** the app does not navigate to the missing `/app/documento/:documentId` route

#### Scenario: Preview actions remain otherwise unchanged
- **WHEN** the document preview renders loaded document actions
- **THEN** the print and export controls remain available according to the existing preview state rules
