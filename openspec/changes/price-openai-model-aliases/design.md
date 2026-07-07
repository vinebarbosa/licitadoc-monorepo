## Context

The OpenAI text-generation adapter normalizes provider usage and calls a local pricing table to compute `costUsd`. When the exact configured model string is not present in that table, the cost calculator returns `null`. That behavior is correct for genuinely unknown models, but it currently also affects model aliases used during experiments, such as `gpt-5.4-mini`, making otherwise successful document-generation runs hard to compare.

Generation runs already persist `providerKey`, `model`, normalized usage, per-call metadata, and pipeline totals. No schema change is needed; the missing piece is reliable model-to-pricing resolution.

For `gpt-5.4-mini`, the accepted pricing source is the official OpenAI API pricing table for Standard processing: $0.75 per 1M input tokens, $0.075 per 1M cached input tokens, and $4.50 per 1M output tokens.

## Goals / Non-Goals

**Goals:**

- Record numeric cost metadata for supported priced OpenAI model strings and aliases used by the application.
- Keep unknown or unpriced model strings visible as `costUsd: null` instead of guessing.
- Add tests that prove both the supported-alias path and unknown-model fallback.
- Keep the change limited to provider cost calculation and metadata aggregation.

**Non-Goals:**

- Change document prompts, generation stages, structured output behavior, or provider selection.
- Backfill historical generation runs.
- Introduce database schema changes.
- Invent public pricing for undocumented model strings without an explicit mapping decision.

## Decisions

1. **Resolve known aliases inside the pricing module**

   The pricing module should own mapping exact model strings to pricing entries because it already owns OpenAI price calculation. This keeps provider code simple and avoids scattering alias checks through the pipeline.

   Alternative considered: normalize `TEXT_GENERATION_MODEL` before constructing the provider. That would hide the originally configured model string from persisted metadata, which is useful when comparing experiments, so it is not preferred.

2. **Preserve original model metadata**

   The run should continue storing the actual configured model string, such as `gpt-5.4-mini`, even if pricing is resolved through an alias entry. This keeps auditability and model comparison intact.

   Alternative considered: store only a canonical model. That makes cost calculation simpler but loses the exact experimental input.

3. **Keep `null` for unsupported pricing**

   If the model is not explicitly priced or aliased, the calculator should continue returning `null`. This avoids creating misleading costs for preview, typo, or unsupported models.

   Alternative considered: fall back to the nearest known family price. That would make dashboards look complete, but it could silently misprice real usage.

4. **Add tests around costs, aliases, and provider metadata**

   Unit tests should cover direct cost calculation for supported aliases and the provider metadata path that records `costUsd`. Unknown model tests should remain in place to protect the controlled fallback.

## Risks / Trade-offs

- **Risk: Alias price becomes stale** -> Mitigation: keep pricing entries explicit, add tests naming the aliases, and document that new model strings need a deliberate pricing update.
- **Risk: model pricing changes over time** -> Mitigation: keep pricing entries explicit, cite the pricing source in this design, and update entries deliberately when OpenAI pricing changes.
- **Risk: Historical runs still show `null`** -> Mitigation: treat this change as forward-looking; backfill can be proposed separately if needed for reporting.
- **Risk: Pipeline total still becomes `null` when one stage is unpriced** -> Mitigation: test the expected aggregation behavior so mixed priced/unpriced calls stay visible rather than silently partial.
