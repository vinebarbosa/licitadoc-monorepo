## Context

The latest generated DFD showed `Processo: licitacao` even though the document was otherwise structurally valid. The value comes from stored process metadata: `buildDfdGenerationContext` currently resolves `processType` from `process.procurementMethod`, `process.biddingModality`, extracted `processType`, and finally `process.type`. When the fallback reaches `process.type`, it exposes the internal slug directly to the prompt and recipe template.

The fix should be deterministic backend behavior, not another model instruction. The provider should receive document-facing labels in the structured context so every model sees the same clean administrative value.

## Goals / Non-Goals

**Goals:**

- Convert known process type slugs to Portuguese display labels before they enter document-generation prompt context.
- Keep raw stored values unchanged in the process table and public process contracts.
- Ensure DFD generation no longer emits `Processo: licitacao` when the stored process type is `licitacao`.
- Add regression coverage around prompt/context assembly so the bug does not return across model changes.

**Non-Goals:**

- Renaming existing database enum/string values.
- Backfilling historical documents already generated with the raw slug.
- Changing the broader document generation pipeline, model selection, or structured output flow.

## Decisions

### Decision: Normalize at document context assembly time

Introduce or reuse a small formatter in the documents module that maps persisted process type values to document-facing labels before building generation context. For example, `licitacao` should become `Licitação`.

Alternative considered: add another prompt instruction telling the model to accent and humanize the field. Rejected because this is a known closed vocabulary value and should not consume model attention or vary by provider.

### Decision: Preserve raw process fields for API compatibility

The normalized value should be used for document-generation context and recipe interpolation only. Stored process records and process API responses should continue exposing their existing values unless a separate product decision changes those contracts.

Alternative considered: migrate stored `process.type` to display labels. Rejected because it risks breaking filtering, existing tests, and any code that treats the field as a stable machine value.

### Decision: Prefer explicit mappings with safe fallback

Known internal values should have explicit labels. Unknown values should fall back to a conservative humanization path that replaces separators with spaces and capitalizes words, while preserving already human-readable extracted values.

Alternative considered: hard-code only `licitacao`. Rejected because the same leak can happen for future slugs such as `dispensa`, `inexigibilidade`, or underscore-separated values.

## Risks / Trade-offs

- [Risk] A value from source metadata is already a precise legal modality and gets over-normalized. -> Mitigation: only map known machine slugs directly and use a minimal fallback that keeps readable text intact.
- [Risk] Multiple prompt fields continue to expose raw values through recipe placeholders. -> Mitigation: update both context assembly tests and recipe/template references that touch process type.
- [Risk] Existing generated documents still show the old value. -> Mitigation: treat this as forward-only generation behavior; regeneration will produce corrected text.
