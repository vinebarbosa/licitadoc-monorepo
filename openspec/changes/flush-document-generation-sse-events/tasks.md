## 1. SSE Delivery Hardening

- [x] 1.1 Add anti-buffering headers to document generation SSE responses, including `x-accel-buffering: no`.
- [x] 1.2 Flush SSE headers immediately after opening the stream.
- [x] 1.3 Configure the raw HTTP socket with no-delay behavior when available.
- [x] 1.4 Update SSE event writing to emit a complete frame per event and flush after each frame when supported.
- [x] 1.5 Preserve CORS headers, auth checks, document visibility checks, snapshots, heartbeat, completion, failure, and cleanup behavior.

## 2. Event Timing Evidence

- [x] 2.1 Add monotonically increasing sequence metadata to transient generation events or SSE frames.
- [x] 2.2 Add server-side publish/write timing evidence through event payload metadata or debug logs.
- [x] 2.3 Keep existing event names and required payload fields compatible with the current frontend parser.

## 3. Tests

- [x] 3.1 Add or update API tests for SSE streaming headers and CORS compatibility.
- [x] 3.2 Add or update unit tests for SSE frame writing and per-event flush behavior.
- [x] 3.3 Add or update tests for event sequence/timing metadata without breaking existing consumers.
- [x] 3.4 Add regression coverage that completion and failure events still close/refetch through the existing flow.

## 4. Validation

- [x] 4.1 Run the relevant API document generation tests.
- [x] 4.2 Run the API typecheck.
- [x] 4.3 Run focused lint/format validation for touched API files.
