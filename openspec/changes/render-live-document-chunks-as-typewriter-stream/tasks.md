## 1. Live Chunk Rendering

- [x] 1.1 Refactor `useDocumentGenerationEvents` to treat `chunk.textDelta` as the primary live rendering input.
- [x] 1.2 Add separate received and visible content buffers inside the hook.
- [x] 1.3 Add a browser-native drain loop that appends queued text to visible content over successive ticks or frames.
- [x] 1.4 Reconcile snapshot events without duplicating already visible or received text.
- [x] 1.5 Reconcile completed events, flush or fast-forward pending text, close the stream, and keep the existing detail refetch.
- [x] 1.6 Preserve unavailable/failure cleanup behavior and close timers/EventSource on unmount or document id changes.

## 2. Preview Integration

- [x] 2.1 Keep `DocumentPreviewPageUI` rendering through the existing `livePreview.content` surface.
- [x] 2.2 Keep print/export actions disabled while rendering live generated content.
- [x] 2.3 Keep completed persisted `draftContent` authoritative after refetch.

## 3. Tests

- [x] 3.1 Update live preview tests to assert deltas become visible in order before completion.
- [x] 3.2 Add a burst test where several chunks arrive together and visible content drains progressively instead of jumping straight to the final accumulated content.
- [x] 3.3 Add or update tests for snapshot reconciliation without duplicated text.
- [x] 3.4 Add or update tests for completed event reconciliation, refetch, and stream cleanup.
- [x] 3.5 Add or update tests for fallback/unavailable stream behavior.

## 4. Validation

- [x] 4.1 Run the relevant web document preview tests.
- [x] 4.2 Run the web typecheck.
- [x] 4.3 Run focused lint/format validation for touched web files.
