## Why

The preview now animates received deltas, but Chrome's EventStream still appears to receive document generation events in bursts or all at once. This suggests the backend delivery path may still buffer SSE writes between provider chunks and the browser, so the system needs explicit low-latency SSE flushing and observability at the backend boundary.

## What Changes

- Harden the document generation SSE route for low-latency delivery by flushing headers immediately and disabling common buffering layers.
- Flush each SSE event write after `chunk`, `snapshot`, `completed`, and `failed` events where Node/Fastify exposes a flush path.
- Configure the SSE socket/response for streaming delivery, including no-delay behavior and anti-buffering headers.
- Add lightweight event sequence/timing metadata or server logs/tests that make it possible to distinguish provider delay from API/SSE buffering.
- Add backend tests for SSE headers and event framing/flush behavior.
- Preserve the existing SSE event contract, auth checks, document visibility, frontend hook contract, and final persistence lifecycle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation`: Realtime generation event delivery must minimize backend buffering and expose enough timing evidence to diagnose whether chunks are delayed before or after the API SSE boundary.

## Impact

- `apps/api/src/modules/documents/routes.ts`
- `apps/api/src/modules/documents/document-generation-events.ts`
- `apps/api/src/modules/documents/document-generation-worker.ts`
- API tests for document generation SSE delivery.
- No database migration, API client regeneration, or frontend UI changes required.
