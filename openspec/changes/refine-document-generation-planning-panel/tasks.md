## 1. Planning Panel UI

- [x] 1.1 Replace the raw planning transcript block in the document preview page with a compact planning status panel.
- [x] 1.2 Render concise generation phases or status messaging instead of raw accumulated planning content.
- [x] 1.3 Ensure the panel has a restrained, polished visual treatment that fits the current app shell and document preview surface.
- [x] 1.4 Keep the compact panel outside the generated document sheet and pending document preview body.

## 2. Behavior Preservation

- [x] 2.1 Preserve live/typewriter rendering for final generated document text chunks.
- [x] 2.2 Preserve the pending preview state while no generated document text is available.
- [x] 2.3 Preserve disabled print and export actions while a document is still generating.
- [x] 2.4 Preserve realtime fallback and completion refetch behavior without backend, provider, or SSE contract changes.

## 3. Tests

- [x] 3.1 Update document preview tests to expect the compact planning panel when planning progress arrives.
- [x] 3.2 Add regression coverage that raw planning content is not rendered as a large user-facing transcript.
- [x] 3.3 Add coverage that no button, disclosure, drawer, modal, or equivalent raw reasoning details control is rendered.
- [x] 3.4 Keep or update existing assertions for clean final document content and disabled partial-content actions.

## 4. Validation

- [x] 4.1 Run focused document preview frontend tests.
- [x] 4.2 Run web typecheck for the touched frontend code.
- [x] 4.3 Run focused lint or formatting validation for touched files.
