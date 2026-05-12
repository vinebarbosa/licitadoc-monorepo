## Context

The current document preview page fetches document detail and polls every second while `status === "generating"`. During that period the UI only shows a static pending card because `draftContent` is persisted after the generation worker receives the final provider result.

The Ollama adapter now consumes streaming responses internally, but its public provider contract still resolves only once with the final text. To make the frontend preview real-time, the generation worker needs access to incremental text deltas and the API needs a scoped browser-consumable channel for those deltas.

## Goals / Non-Goals

**Goals:**

- Render partial generated document content in the existing preview surface while generation is still running.
- Keep final document persistence and lifecycle states unchanged: `generating`, `completed`, `failed`.
- Preserve the existing `generateText` final-result contract while allowing internal consumers to receive optional chunk callbacks.
- Add an authenticated, organization-scoped event stream for a document being generated.
- Keep the current polling detail query as the fallback path when streaming is unavailable.

**Non-Goals:**

- Add collaborative editing, manual editing, retry generation, or export implementation.
- Persist every intermediate chunk as final `draftContent`.
- Introduce WebSockets or a new realtime dependency.
- Require all providers to support token-level streaming before they can satisfy the provider contract.

## Decisions

1. **Use optional chunk callbacks on the provider input.**
   Extend the internal text generation contract with an optional `onChunk` callback that receives text deltas from providers that can stream. `generateText` still returns a complete `TextGenerationResult`, so existing document finalization and non-streaming providers remain compatible. Ollama invokes the callback for each parsed `response` fragment; stub/OpenAI can emit nothing or emit once after full output.

2. **Publish transient document generation events from the worker.**
   Add a lightweight in-memory publisher owned by the API process and available to the document generation worker and routes. The worker accumulates partial text per generation run, publishes `chunk` events as deltas arrive, then publishes `completed` or `failed` events when the existing lifecycle update finishes.

3. **Expose realtime updates with Server-Sent Events.**
   Add `GET /api/documents/:documentId/events` as an authenticated SSE endpoint. The route uses the same document visibility rules as detail reads before subscribing. SSE fits the one-way nature of generation progress, works with browser `EventSource`, and avoids a WebSocket dependency.

4. **Keep persisted document content authoritative.**
   Partial content shown in the preview is ephemeral and only used for live feedback. On `completed`, the frontend invalidates/refetches document detail and renders the persisted `draftContent`. On reconnect or page refresh, the SSE endpoint may send the current in-memory snapshot when available; otherwise the existing polling state remains the fallback.

5. **Render partial content through the same document preview layout.**
   The frontend hook subscribes while the loaded document is `generating`, accumulates partial content, and passes it into the existing document sheet/markdown renderer. Export and print actions remain disabled until the document is completed and persisted content is available.

6. **Manual EventSource adapter stays inside the documents module.**
   The generated API client remains the default for JSON endpoints. Because SSE is a streaming browser primitive that is not a normal JSON OpenAPI contract, the EventSource wrapper lives in `apps/web/src/modules/documents/api` as a documented module-level adapter.

## Risks / Trade-offs

- **SSE events are process-local** -> This matches the current in-process generation queue. A future multi-instance deployment should replace the in-memory publisher with shared pub/sub or persisted progress.
- **A subscriber that joins late may miss earlier chunks** -> Keep an in-memory snapshot per active document and retain polling fallback; final persisted content remains authoritative.
- **Very frequent chunks could produce excessive React renders** -> Batch or debounce frontend state updates if provider chunks are too small in practice.
- **Cross-origin EventSource cookie behavior can be fussy in development** -> Use `withCredentials: true` and keep the API CORS credentials policy aligned with the existing authenticated JSON calls.
- **Provider callbacks must not break final generation** -> Treat callback failures as non-fatal for provider generation where possible, or normalize them as document streaming failures without corrupting final persistence.
