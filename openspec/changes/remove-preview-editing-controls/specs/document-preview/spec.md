## ADDED Requirements

### Requirement: Document preview MUST remain read-only
The document preview route MUST present document content for viewing and non-editing actions only. It MUST NOT expose controls that mutate document text, generate text-adjustment suggestions, apply text adjustments, or otherwise start an editing workflow from the preview surface.

#### Scenario: Completed document text is selected in preview
- **WHEN** an authorized actor selects text inside a completed document preview
- **THEN** the system keeps the preview in viewing mode without opening an adjustment panel, suggestion form, apply action, or edit overlay
- **AND** the system does not call document text-adjustment suggestion or apply APIs from the preview route

#### Scenario: Completed document is viewed in preview
- **WHEN** an authorized actor opens a completed document preview
- **THEN** the system renders the document content and non-editing preview actions such as print or export
- **AND** the system does not render document-content editing controls

#### Scenario: Generating document is viewed in preview
- **WHEN** an authorized actor opens a document preview while generation is still in progress
- **THEN** the system may render live preview progress and partial read-only content
- **AND** the system does not expose text-adjustment or document editing controls during generation
