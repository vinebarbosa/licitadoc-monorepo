## Context

The current live preview path can animate final document text once the frontend receives `response` chunks from the provider. The problem is that Ollama thinking-capable models can emit a long sequence of `thinking` deltas before any final `response` text. Disabling thinking makes `response` appear earlier, but the product direction is now to keep thinking enabled for higher-quality procurement drafts and make that planning visible without polluting the final document.

The system already has a transient in-memory event bus, an authenticated SSE route, and a frontend hook that consumes document generation events. This change should extend that pipeline rather than introducing a new realtime transport.

Current desired flow:

```txt
Ollama /api/generate stream
  ├─ thinking delta ─▶ provider planning callback ─▶ SSE planning event ─▶ UI planning area
  └─ response delta ─▶ provider text callback     ─▶ SSE chunk event    ─▶ document sheet
```

## Goals / Non-Goals

**Goals:**

- Keep Ollama thinking enabled for document generation.
- Stream thinking/planning progress to the UI separately from final document text.
- Keep the final document preview and persisted `draftContent` composed only from generated `response` text.
- Preserve the existing typewriter-style document preview once final document chunks begin.
- Replace the recently added forced `think: false` behavior with thinking-enabled streaming.
- Keep authorization, SSE cleanup, completion, failure, and fallback polling behavior intact.

**Non-Goals:**

- Persist planning/thinking content in the database.
- Export, print, or include thinking content in DOCX/PDF output.
- Treat raw thinking as legally reviewed document content.
- Introduce WebSockets, Redis, or a second generation job.
- Guarantee final document text before the provider emits `response`; if the model spends time thinking first, the document sheet may still wait while the planning area updates.

## Decisions

1. **Use separate callback fields for final text and planning progress.**

   Extend the provider input with an optional `onPlanningChunk` or equivalent callback while preserving the existing `onChunk` generated-text callback. This keeps `onChunk` semantically clean: it means final document text only. The alternative of sending thinking through `onChunk.metadata` was rejected because document workflow consumers already use `textDelta` to build document content.

2. **Remove forced `think: false` from Ollama requests.**

   The Ollama provider should not send `think: false`. It may omit `think` and rely on model defaults, or explicitly send `think: true` if needed for the configured model. The implementation should prefer the smallest reliable change; direct local behavior already showed thinking appears without `think: false`.

3. **Map Ollama `thinking` to transient planning events.**

   When Ollama emits non-empty `thinking`, the provider should invoke the planning callback. The worker/event bus should publish a `planning` or `thinking` event with a delta and accumulated planning text. This event must be transient like partial document chunks.

4. **Keep final content accumulation unchanged.**

   Only non-empty `response` fragments should append to generated document text and trigger existing document `chunk` events. This preserves final persistence, sanitization, previews, and exports.

5. **Render planning separately and carefully.**

   The preview page should show a compact planning/thinking area while generation is active. It should not look like part of the official document. Labels should make clear this is AI planning/progress, while the document sheet remains the final draft surface.

6. **Completion should settle on persisted document content.**

   On completion, the client should continue refetching the authoritative persisted document. Planning content can remain visible during the generating session or collapse after completion, but it must not be required to render the completed document.

## Risks / Trade-offs

- **Thinking can be verbose, English, or messy.** -> Render it in a clearly separate, secondary area and consider truncating, collapsing, or summarizing later.
- **Users may over-trust planning text.** -> Avoid presenting it as document content; keep print/export disabled until completion.
- **Final document text may still start later than desired.** -> This is a model/provider behavior; the UI should show planning progress during that interval so the page is not frozen.
- **Provider contract grows beyond text-only deltas.** -> Keep the extension optional and provider-agnostic as planning progress, not Ollama-specific raw objects.
- **The previous `think:false` change conflicts with this direction.** -> This change must explicitly remove or override it and update tests to expect thinking-enabled behavior.
