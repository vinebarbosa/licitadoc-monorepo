## Why

The document preview currently receives realtime SSE chunks, but the frontend renders the accumulated `content` payload from each event. When many chunks arrive before React paints, the preview appears to wait for a large batch and then only simulates the writing effect, instead of revealing each received delta as it arrives.

## What Changes

- Render live document generation from incoming `textDelta` chunks instead of replacing the preview with the latest accumulated `content` payload.
- Add a small frontend display buffer so received deltas are progressively drained into visible content, creating a chat-like typewriter stream.
- Keep the existing SSE contract, completion refetch, polling fallback, final persisted `draftContent`, and disabled print/export behavior unchanged.
- Ensure snapshots and completed events can fast-forward or reconcile visible content without losing already received text.
- Add tests for incremental delta rendering, burst handling, completion reconciliation, cleanup, and fallback behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `document-generation`: Realtime preview rendering must present incoming generation deltas progressively as visible text, instead of relying only on accumulated event content.

## Impact

- `apps/web/src/modules/documents/api/documents.ts`
- `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend API, database, provider, or API client regeneration changes are required.
