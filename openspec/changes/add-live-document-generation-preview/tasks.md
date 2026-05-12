## 1. Provider Streaming Hooks

- [x] 1.1 Extend the internal text generation types with a generic incremental chunk payload and optional callback.
- [x] 1.2 Update the Ollama provider to invoke the callback for each streamed `response` fragment while preserving the final result.
- [x] 1.3 Keep OpenAI and stub providers compatible with the extended contract without requiring provider-specific document workflow branches.
- [x] 1.4 Update provider tests for callback emission, final result preservation, and non-streaming provider compatibility.

## 2. Document Generation Events API

- [x] 2.1 Add an in-memory document generation event publisher/subscriber owned by the API process.
- [x] 2.2 Wire the document generation worker to accumulate partial content and publish chunk progress events.
- [x] 2.3 Publish completion and failure events after the existing document lifecycle persistence succeeds.
- [x] 2.4 Add an authenticated `GET /api/documents/:documentId/events` SSE route that enforces document visibility before subscribing.
- [x] 2.5 Ensure the SSE route sends snapshots when available, heartbeats or keepalive comments as needed, and cleans up subscribers on disconnect.
- [x] 2.6 Add API tests for authorized streaming, unauthorized access, chunk events, completion events, failure events, and cleanup behavior.

## 3. Frontend Live Preview

- [x] 3.1 Add a documents-module EventSource adapter/hook for subscribing to document generation events with credentials.
- [x] 3.2 Update the document preview page to subscribe while the document is `generating` and accumulate partial content safely.
- [x] 3.3 Render partial content through the existing document sheet and markdown preview layout while keeping generation status visible.
- [x] 3.4 Keep print/export actions disabled until completed persisted content is available.
- [x] 3.5 Invalidate or refetch document detail on completion or failure events, and close the stream on unmount or document id changes.
- [x] 3.6 Preserve polling fallback when the realtime stream fails or is unavailable.
- [x] 3.7 Add web tests for live partial rendering, no-content pending state, completion refetch, failure state, fallback polling, disabled actions, and subscription cleanup.

## 4. Validation

- [x] 4.1 Run the relevant API test suite and API typecheck.
- [x] 4.2 Run the relevant web test suite and web typecheck.
- [x] 4.3 Run lint or package validation commands required by the touched API/web packages.
