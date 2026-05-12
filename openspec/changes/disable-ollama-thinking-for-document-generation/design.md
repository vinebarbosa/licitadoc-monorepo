## Context

The live document preview now consumes SSE generation chunks correctly, and backend SSE delivery has been hardened. The remaining delay is upstream of SSE: the current Ollama model can emit streamed NDJSON chunks where `thinking` contains realtime tokens while `response` remains empty. The API's normalized provider contract intentionally publishes only generated document text from `response`, so thinking tokens are hidden and the preview does not receive visible chunks until the final answer begins.

Direct local checks against Ollama showed that adding `think: false` to `/api/generate` causes the same model to emit visible `response` tokens immediately. Document generation does not need model reasoning text, and exposing reasoning would be undesirable for procurement draft content.

## Goals / Non-Goals

**Goals:**

- Make Ollama document generation emit visible `response` chunks as early as possible.
- Preserve `stream: true`, normalized `TextGenerationProvider` behavior, final text accumulation, metadata handling, and normalized errors.
- Keep reasoning/thinking text out of the generated draft and out of live preview events.
- Cover the request payload and incremental callback behavior with focused API tests.

**Non-Goals:**

- Display Ollama `thinking` text in the frontend or persist it with documents.
- Change prompts, recipes, document templates, model names, or frontend typewriter animation.
- Add a new realtime transport or another provider dependency.
- Make thinking configurable in the UI.

## Decisions

1. **Send `think: false` for Ollama generation requests.**

   The Ollama provider should include `think: false` in the JSON body sent to `/api/generate`. This keeps the adapter behavior explicit and avoids relying on model defaults, which vary by model and Ollama version. The alternative of parsing and publishing `thinking` was rejected because thinking is not final document content and would leak model reasoning into the preview.

2. **Keep publishing only `response` chunks.**

   The normalized generation contract represents generated document text, not model-internal reasoning. The provider should continue appending and emitting only non-empty `response` fragments. This preserves downstream behavior in the document worker, event bus, SSE route, and frontend preview.

3. **Do not add configuration until a real need appears.**

   The current use case is document drafting, where visible output should start quickly and reasoning should stay hidden. A future env flag can be introduced if another Ollama use case needs thinking enabled, but adding that now would widen the surface without changing the immediate behavior.

4. **Test at the provider boundary.**

   Existing tests already stub `fetch` and streaming bodies. The new tests should inspect the JSON body sent to Ollama and assert that streamed `response` fragments continue to invoke `onChunk` in order. This catches regressions without requiring a running Ollama instance.

## Risks / Trade-offs

- **Older Ollama versions may ignore or reject `think`.** -> Treat 4xx responses through the existing normalized error path; if this appears in practice, a version-aware fallback can be added.
- **Some models may not support thinking anyway.** -> `think: false` is harmless for non-thinking models if accepted by Ollama and keeps behavior consistent across models.
- **Disabling thinking may change output quality for reasoning-heavy models.** -> Procurement drafts need realtime visible document output more than hidden reasoning, and the existing recipes/templates still provide structure.
- **The frontend may still type from a queue if chunks arrive faster than display speed.** -> This is expected; the key change is that the queue should begin receiving real `response` deltas earlier.
