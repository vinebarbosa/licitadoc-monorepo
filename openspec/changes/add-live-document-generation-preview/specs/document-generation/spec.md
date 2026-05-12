## ADDED Requirements

### Requirement: Document generation MUST publish authorized realtime progress events
The system MUST expose realtime generation progress for a generated document through an authenticated, document-scoped event stream. The stream MUST enforce the same organization visibility rules as generated document detail reads.

#### Scenario: Authorized actor subscribes to a generating document
- **WHEN** an authenticated actor with visibility over a document subscribes while the document status is `generating`
- **THEN** the system opens a realtime event stream for that document
- **AND** the stream sends generated text progress as the provider emits chunks

#### Scenario: Unauthorized actor subscribes to a document stream
- **WHEN** an authenticated actor without visibility over a document attempts to subscribe to its generation stream
- **THEN** the system rejects the subscription using the same authorization behavior as document detail reads

#### Scenario: Provider emits generated text chunks
- **WHEN** the active provider emits incremental generated text during a document generation run
- **THEN** the document generation workflow publishes progress events containing the document id, text delta, accumulated partial content, and current generation status
- **AND** the workflow continues to persist the final draft content through the existing successful completion path

#### Scenario: Generation completes while a client is subscribed
- **WHEN** the provider finishes successfully and the document is marked `completed`
- **THEN** the realtime stream publishes a completion event
- **AND** the completion event allows clients to refetch the authoritative persisted document detail

#### Scenario: Generation fails while a client is subscribed
- **WHEN** the provider fails and the document is marked `failed`
- **THEN** the realtime stream publishes a failure event with normalized failure information
- **AND** the failure state remains available through the persisted document detail lifecycle

### Requirement: Realtime progress MUST remain transient until generation finalizes
The system MUST treat streamed partial content as transient progress feedback and MUST keep persisted `draftContent` authoritative only after successful generation finalization.

#### Scenario: Detail read occurs before generation completes
- **WHEN** an authorized actor reads document detail while generation is still in progress
- **THEN** the detail response may continue to expose `draftContent` as empty or null
- **AND** clients that need partial content use the realtime event stream instead of relying on persisted final content

#### Scenario: Generation finishes successfully
- **WHEN** document generation completes successfully after emitting partial progress events
- **THEN** the final sanitized draft content is persisted using the existing completed document workflow
- **AND** subsequent document detail reads return the completed persisted content
