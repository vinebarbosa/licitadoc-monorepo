## ADDED Requirements

### Requirement: Document generation realtime events MUST distinguish planning progress from document text
The document generation workflow MUST publish planning/thinking progress as a separate transient realtime event type from generated document text chunks. Planning progress MUST NOT be accumulated into generated document content, persisted `draftContent`, completion content, or exportable document output.

#### Scenario: Provider emits planning progress
- **WHEN** the active provider emits planning or thinking progress during a document generation run
- **THEN** the document generation workflow publishes a document-scoped realtime planning event
- **AND** the event contains the document id, planning delta, accumulated transient planning content, and current generation status

#### Scenario: Provider emits generated document text
- **WHEN** the active provider emits generated document text during a document generation run
- **THEN** the document generation workflow publishes the existing document text progress event
- **AND** the event contains the document id, text delta, accumulated partial document content, and current generation status

#### Scenario: Generation completes after planning progress
- **WHEN** generation completes successfully after emitting planning progress and generated document text
- **THEN** the system persists only the sanitized generated document text as `draftContent`
- **AND** the completion event contains final document content without planning progress

#### Scenario: New subscriber receives current transient progress
- **WHEN** an authorized client subscribes to a document generation stream after planning and document text have already started
- **THEN** the stream can provide current transient planning progress and current transient document text progress separately
- **AND** the stream keeps the same authorization and document visibility rules as existing generation events

### Requirement: Planning progress MUST remain transient and scoped to generation visibility
Planning/thinking progress MUST be available only as temporary realtime feedback for authorized viewers of the document generation stream. It MUST be cleaned up with the transient generation state and MUST NOT create a durable record.

#### Scenario: Document detail is read during planning
- **WHEN** an authorized actor reads document detail while the provider is emitting planning progress
- **THEN** the detail response does not expose planning progress
- **AND** clients use the realtime event stream for planning feedback

#### Scenario: Generation fails after planning
- **WHEN** generation fails after emitting planning progress
- **THEN** the system publishes the existing failure event with normalized failure information
- **AND** planning progress remains transient and is not persisted as document content or error details
