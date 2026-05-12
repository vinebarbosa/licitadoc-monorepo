## Context

The realtime document preview now connects to the SSE route and receives `chunk` events. Each event includes both `textDelta` and accumulated `content`, but the current frontend hook renders by calling `setContent(payload.content)` for every event. When the browser receives many chunks in quick succession, React may batch state updates and paint only the latest accumulated value, which feels like the app waited for a large part of the document and then revealed it.

The desired behavior is closer to chat streaming: each received delta enters a visible writing queue and the preview grows progressively while generation is still running.

## Goals / Non-Goals

**Goals:**

- Render live document preview from received `textDelta` values in order.
- Keep a clear distinction between content received from SSE and content currently visible in the UI.
- Smooth bursty chunk delivery into a progressive typewriter-like display without blocking completion handling.
- Keep the existing document sheet, markdown renderer, SSE endpoint, final refetch, polling fallback, and export/print rules.
- Preserve correctness when the stream starts from an in-memory snapshot, reconnects, completes, fails, or unmounts.

**Non-Goals:**

- Change Ollama streaming behavior, provider contracts, or the backend SSE event shape.
- Persist intermediate chunks as `draftContent`.
- Add new realtime transport, worker architecture, or external animation dependency.
- Apply this typewriter behavior to completed persisted documents outside the generation preview.

## Decisions

1. **Use `textDelta` as the primary live rendering input.**

   The hook should enqueue `payload.textDelta` from `chunk` events instead of replacing visible content with `payload.content`. This matches the user's mental model: every chunk received should become visible in sequence. The accumulated `content` field remains useful for snapshots and reconciliation.

2. **Separate received content from visible content.**

   Maintain an internal received buffer that represents the complete stream seen so far, plus a visible buffer rendered by the page. A small animation loop drains pending characters from the received buffer into the visible buffer. This prevents React batching from hiding intermediate updates while preserving ordered output.

3. **Drain pending text at a controlled pace.**

   Use a browser-native timer or `requestAnimationFrame` loop to append small batches of characters to visible content. The implementation should favor readability over theatrical animation: fast enough to keep up with real generation, slow enough that bursts remain perceptibly progressive. The batch size/rate can be constants near the hook so tests can control timers.

4. **Reconcile snapshots and completion without corrupting order.**

   Snapshot events should seed or replace the received buffer when they contain more content than the local state. Completed events should accept authoritative completed content, close the stream, flush remaining pending text quickly or immediately, then trigger the existing refetch. Failed events should close the stream and preserve the existing failed fallback behavior.

5. **Keep UI integration minimal.**

   The preview page should continue passing one `livePreview.content` value into `DocumentSheet`. The hook can expose the animated visible content under the same field, so the page layout remains stable and the change is contained to the documents API adapter plus tests.

## Risks / Trade-offs

- **Rendering too slowly can lag behind generation** -> Choose a rate that drains faster than typical token arrival and flush on completion.
- **Rendering too quickly can still feel batched** -> Drain in small visible batches instead of replacing with full accumulated content.
- **Markdown may reflow as partial syntax arrives** -> This already happens with realtime Markdown; keep using the same renderer so final formatting remains consistent.
- **Timer cleanup bugs can update unmounted components** -> Clear intervals/animation frames and close EventSource on unmount and document id changes.
- **Snapshots can duplicate text if naively appended** -> Treat snapshot/completed `content` as authoritative accumulated content and only append missing suffixes when reconciling.
