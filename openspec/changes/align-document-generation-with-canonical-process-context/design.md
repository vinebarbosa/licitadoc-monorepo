## Context

Document generation already loads the parent process, organization, departments, and structured process items before building the prompt. However, prompt assembly still has legacy SD/source metadata assumptions in important places: estimate extraction primarily reads `sourceMetadata`, canonical kit items are flattened without component evidence, and prompt labels use SD-specific wording even for manually created processes.

The process creation/editing flow is now moving toward canonical process fields and first-class `processItems`, so generation quality should be anchored in those canonical fields first. Legacy source metadata should remain a compatibility fallback for imported or old records, not the default mental model.

## Goals / Non-Goals

**Goals:**

- Make structured process items the primary item evidence for generated DFD, ETP, TR, and Minuta prompts.
- Preserve kit component names, descriptions, quantities, and units in the prompt context.
- Derive estimate/price context from canonical item totals before using legacy source metadata.
- Use neutral labels for canonical item evidence and reserve SD wording for source-metadata fallback.
- Resolve a responsible display name from canonical responsible-user data when available, while preserving current `responsibleName` fallback behavior.
- Cover prompt assembly behavior with focused API unit tests.

**Non-Goals:**

- Redesign generation recipes, templates, or the document lifecycle.
- Change the public document creation API, route shape, or frontend document generation flow.
- Add database migrations or alter stored process/document ownership.
- Remove legacy source metadata fallback for existing imported processes.

## Decisions

### Decision: Normalize canonical process items into richer generation evidence

Prompt assembly should use a generation-specific item evidence structure that can represent simple items and kit items. For simple items, preserve code, title/description, quantity, unit, unit value, and total value. For kit items, preserve the kit identity plus an ordered list of components with title, description, quantity, and unit.

Alternative considered: continue flattening each kit into a single item line. That keeps prompt changes small but loses the details users now enter specifically to improve generated documents.

### Decision: Derive estimates from canonical totals first

The estimate/price helper should compute the best available raw estimate from canonical item totals when one or more totals are present. Source metadata totals remain a fallback for legacy/imported rows where no canonical totals exist. This keeps manually created processes from appearing value-less in ETP and Minuta prompts.

Alternative considered: keep estimate extraction source-metadata-only and rely on recipes to infer values from item lines. That is fragile and can still produce `não informado` guidance even when canonical totals exist.

### Decision: Make item labels origin-aware

Canonical process items should be labeled as `Itens do processo` or equivalent neutral copy. SD-specific labels such as `Itens da SD revisados` should only appear when the evidence comes from legacy/source metadata. This prevents manual process prompts from implying an imported Solicitação de Despesa that never existed.

Alternative considered: rename everything to `Itens do processo` unconditionally. That is simpler, but imported SD prompts benefit from preserving source traceability when the data really came from SD extraction.

### Decision: Resolve responsible display name before prompt assembly

`createDocument` should pass a responsible display name into prompt assembly when the process has canonical responsible-user data available. Prompt assembly should still fall back to stored `responsibleName`, source metadata responsible name, and department responsible data so current rows and legacy imports continue to generate.

Alternative considered: postpone responsible-user resolution until the broader responsible model migration is complete. That would leave a known seam in generation and make future migration easier to miss.

## Risks / Trade-offs

- [Risk] Longer item/component prompt context can make prompts noisier for large processes. -> Mitigation: keep item evidence compact, ordered, and capped/truncated similarly to existing item description handling.
- [Risk] Summing item totals can produce misleading values when only some items have totals. -> Mitigation: only present an item-derived estimate when at least one canonical total exists, and preserve guidance that the value comes from submitted item totals.
- [Risk] Legacy tests currently assert SD-specific wording. -> Mitigation: split tests between canonical item prompts and source-metadata fallback prompts.
- [Risk] Responsible user data may not exist for current rows. -> Mitigation: keep current fallback order and avoid making responsible-user lookup mandatory for generation.
