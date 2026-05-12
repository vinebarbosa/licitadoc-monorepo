## 1. Provider Contract

- [x] 1.1 Extend the text generation input contract with an optional planning/thinking progress callback.
- [x] 1.2 Remove the forced `think: false` behavior from the Ollama `/api/generate` request.
- [x] 1.3 Map non-empty Ollama `thinking` deltas to the planning callback without appending them to generated text.
- [x] 1.4 Keep non-empty Ollama `response` deltas mapped to the existing generated-text callback and final result text.
- [x] 1.5 Preserve existing provider metadata, malformed stream, error chunk, empty response, and timeout behavior.

## 2. Backend Realtime Events

- [x] 2.1 Add a transient planning/thinking event type to the document generation event model.
- [x] 2.2 Accumulate planning progress separately from accumulated document text in the generation event store.
- [x] 2.3 Publish planning events from the document generation worker when the provider emits planning progress.
- [x] 2.4 Keep completed and failed events compatible with existing clients and ensure completion content excludes planning text.
- [x] 2.5 Preserve SSE headers, CORS, auth, visibility checks, heartbeat, snapshot, cleanup, and polling fallback behavior.

## 3. Frontend Live Preview

- [x] 3.1 Extend the document generation event parser/hook to consume planning events separately from document text chunks.
- [x] 3.2 Render planning progress in a dedicated preview area that is visually separate from the document sheet.
- [x] 3.3 Keep the document sheet built only from generated document text and persisted completed content.
- [x] 3.4 Preserve typewriter-style rendering for final document text chunks.
- [x] 3.5 Keep print/export actions disabled while planning progress or partial document content is visible.
- [x] 3.6 Keep safe fallback behavior when planning events are unavailable or the realtime stream fails.

## 4. Tests

- [x] 4.1 Add or update provider tests for thinking-enabled Ollama requests, planning callbacks, and response callbacks.
- [x] 4.2 Add or update API tests for planning event publication, snapshot separation, and completion content excluding planning text.
- [x] 4.3 Add or update web tests for planning UI rendering, document content separation, completion refetch, and fallback behavior.

## 5. Validation

- [x] 5.1 Run focused API text generation provider tests.
- [x] 5.2 Run focused API document generation/event tests.
- [x] 5.3 Run focused web document preview tests.
- [x] 5.4 Run API and web typechecks for touched packages.
- [x] 5.5 Run focused lint/format validation for touched files.
