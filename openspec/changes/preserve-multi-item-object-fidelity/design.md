## Context

The current multi-item consolidation helper in `documents.shared.ts` classifies composite acquisitions and exposes `objectSummary` fields to DFD, ETP, TR, and Minuta prompts. This solved first-item dominance, but the grouping table can still produce parent labels that are too broad for the source material, especially when contextual words such as event, distribution, or festivity trigger labels like "materiais de apoio a eventos".

The target behavior is narrower: aggregate the object without losing the actual material vocabulary present in the SD. The generated object should remain concrete and source-grounded, not more elaborate or stylistically refined.

## Goals / Non-Goals

**Goals:**

- Preserve lexical fidelity to item names and material groups actually present in the SD.
- Keep multi-item consolidation from collapsing into one dominant item.
- Prevent unsupported category-mother labels such as generic event support, operational inputs, logistical components, or materials diversos when those labels are not directly present.
- Keep consolidated objects concrete, administratively clear, and suitable for all generated document types.
- Add tests for the known potes/kits/embalagens/fitas case and for other over-abstraction risks.
- Keep unitary-object behavior unchanged.

**Non-Goals:**

- Do not add `complexityProfile`.
- Do not increase document density or stylistic sophistication.
- Do not change public APIs, database schema, provider calls, frontend behavior, or process lifecycle.
- Do not implement full SD line-item extraction beyond consuming existing or future structured item arrays.
- Do not invent normalized taxonomies beyond source-grounded grouping labels.

## Decisions

### Decision: Make material item evidence stronger than contextual purpose words

The helper should rank item-derived terms above purpose-derived terms. Structured item arrays, `item.description`, extracted object text, and explicit object lists should be the primary sources for `itemGroups`. Justification and purpose text can help classify `multi_item`, but should not by itself create a broad group label.

Alternative considered: keep current keyword table and add exclusions for event terms. Rejected because the same issue can recur with other generic labels such as operational inputs or diverse materials.

### Decision: Split detection signals from display labels

Composite detection can still use broad signals such as event, distribution, action, or festivity to understand why items are related. Displayed groups and `consolidatedObject` should use only source-grounded item labels or conservative material labels directly tied to item words.

For example, "Dia das Mães" may explain purpose but must not become "materiais de apoio a eventos" unless that category is itself present in the SD.

### Decision: Prefer concrete normalized labels only when they preserve item meaning

The helper may normalize:

- potes/recipientes/vasilhas -> recipientes plásticos reusable when the item text supports it;
- kit/kits -> kits or kits compostos;
- embalagens/sacolas/caixas -> embalagens or itens de acondicionamento;
- fitas/laços/adesivos -> fitas and related finishing/acondicionamento materials;
- cabos/adaptadores/periféricos -> acessórios when present;
- insumos only when the word or a concrete related input is present.

It should not normalize event/distribution/festivity into material groups.

### Decision: Prompt guidance should say "preserve item-group vocabulary", not "make it richer"

Recipe guidance should be small and direct. The model should be told to use the consolidated object only when it reflects actual groups and to avoid replacing concrete items with broad labels. The change is about fidelity, not better prose.

### Decision: Tests should fail on over-abstraction

Tests should assert that known composite cases keep the concrete groups visible and do not include unsupported generic categories. Prompt tests should check DFD/ETP/TR/Minuta because the same `objectSummary` influences all four documents.

## Risks / Trade-offs

- [Risk] The helper may become too literal and miss useful aggregation. -> Mitigation: preserve conservative normalization for obvious material aliases while keeping source words visible.
- [Risk] Some real SDs use generic labels such as "materiais diversos". -> Mitigation: allow generic labels only when they are explicitly present in the source object/items.
- [Risk] Removing purpose-derived display labels may reduce contextual polish. -> Mitigation: keep purpose in `originalObject`, justification, and guidance, but not as an invented item group.
- [Risk] Existing tests may encode the over-broad behavior. -> Mitigation: update tests to protect lexical fidelity rather than generic category creation.
