## ADDED Requirements

### Requirement: Realtime document generation streams MUST satisfy configured browser CORS
The document generation realtime event stream MUST include browser-compatible CORS headers for configured allowed origins when it is served through a manually written SSE response and uses session credentials.

#### Scenario: Allowed web origin opens event stream
- **WHEN** an authenticated browser request to `/api/documents/:documentId/events` includes an `Origin` that matches runtime `CORS_ORIGIN`
- **THEN** the SSE response includes `Access-Control-Allow-Origin` with that exact origin
- **AND** includes `Access-Control-Allow-Credentials: true`
- **AND** includes `Vary: Origin`
- **AND** remains `text/event-stream`

#### Scenario: Disallowed origin attempts to open event stream
- **WHEN** a request to the document generation event stream includes an `Origin` not configured in `CORS_ORIGIN`
- **THEN** the system does not emit permissive CORS headers for that origin
- **AND** the stream remains protected by authentication and document visibility checks

#### Scenario: EventSource uses existing session credentials
- **WHEN** the frontend opens the document generation event stream with credentials from an allowed origin
- **THEN** the browser is able to establish the EventSource connection instead of failing with CORS before events are delivered
