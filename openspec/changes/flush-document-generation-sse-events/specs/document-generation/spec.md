## ADDED Requirements

### Requirement: Realtime document generation SSE events MUST be flushed with minimal API buffering
The document generation realtime event stream MUST minimize API-side buffering after generation events are published. The API MUST configure the SSE response for streaming delivery and MUST write each generation event as an independently flushable SSE frame.

#### Scenario: SSE route opens with streaming headers
- **WHEN** an authenticated browser opens `/api/documents/:documentId/events` for a visible document
- **THEN** the response is `text/event-stream`
- **AND** the response disables transform/caching behavior suitable for streaming
- **AND** the response includes anti-buffering headers for common reverse proxies
- **AND** the response sends headers before waiting for the first generated chunk

#### Scenario: Published chunk is written as a flushable event
- **WHEN** the document generation worker publishes a `chunk` event
- **THEN** the SSE route writes a complete `event: chunk` frame for that event
- **AND** attempts to flush that frame to the client before waiting for a later chunk or completion event
- **AND** preserves the existing `textDelta` and accumulated `content` payload fields

#### Scenario: Socket streaming options reduce coalescing
- **WHEN** the SSE stream is established on a Node HTTP socket that supports no-delay configuration
- **THEN** the API configures the socket to reduce delayed packet coalescing for generation event writes

#### Scenario: Event delivery exposes timing evidence
- **WHEN** chunk, snapshot, completed, or failed events are published to the SSE route
- **THEN** the system exposes sequence and/or server-side timing evidence for those events
- **AND** operators can distinguish provider-side delay from API-side SSE buffering during debugging

#### Scenario: Existing stream contract remains compatible
- **WHEN** an existing frontend client consumes document generation events
- **THEN** required event names and existing payload fields remain compatible
- **AND** authentication, document visibility, CORS, heartbeat, cleanup, completion, and failure behavior remain intact
