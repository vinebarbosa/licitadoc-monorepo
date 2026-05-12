## Context

The previous change added reviewed SD items to process creation and persists them under `sourceMetadata.extractedFields.items`. The API already stores and returns `sourceMetadata` as JSON, so the missing link is document generation: `documents.shared.ts` still builds context from singular legacy fields such as `item.description`, `itemDescription`, `item.quantity`, and `item.unit`.

Current behavior:

```text
sourceMetadata.extractedFields.items[] exists
    |
    v
document context ignores list
    |
    v
prompt receives first item / legacy itemDescription
    |
    v
draft can collapse the demand to one item
```

Target behavior:

```text
sourceMetadata.extractedFields.items[] exists
    |
    v
document context normalizes reviewed items
    |
    v
prompt receives a concise SD item list
    |
    v
draft considers the whole demand
```

This change deliberately avoids the previously rolled-back semantic summary/object grouping layer. The list is factual evidence from reviewed metadata, not an inferred category model.

## Goals / Non-Goals

**Goals:**

- Treat `sourceMetadata.extractedFields.items[]` as the canonical item evidence for document generation when available.
- Preserve compatibility with legacy processes that only have `sourceMetadata.extractedFields.item` or `itemDescription`.
- Format SD items deterministically for prompts, including count and concise numbered lines.
- Make DFD, ETP, TR, and Minuta prompts aware of all reviewed SD items.
- Keep document-specific proportionality: DFD stays high-level; ETP/TR/Minuta can use richer item awareness where appropriate.
- Add regression tests that prove all reviewed items reach the prompt and that legacy fallback still works.

**Non-Goals:**

- Do not add or change database tables.
- Do not change process creation persistence, frontend UI, or API request schema.
- Do not remove legacy singular metadata fields in this change.
- Do not reintroduce `objectSemanticSummary`, semantic grouping, dominant item logic, or AI-based item interpretation.
- Do not build a backend PDF parser for multiple items in this change unless required only for test setup.
- Do not synthesize a contract total from item totals unless a reliable process-level total is already present.

## Decisions

### Decision: Normalize reviewed SD items inside document generation

Add a small helper near the existing source metadata readers that extracts `sourceMetadata.extractedFields.items` only when it is an array of objects. Each item should be normalized defensively:

```ts
type SourceItemForGeneration = {
  code: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
};
```

Rows with no meaningful description/code/quantity/unit/value should be ignored. A single-item SD remains a one-element list and follows the same path as a multi-item SD.

Alternative considered: keep using only `itemDescription` and add stronger prompt instructions. Rejected because the model would still see one item as the most salient evidence.

### Decision: Emit either the reviewed item list or the legacy singular item block

Prompt assembly should not place a detailed first-item line next to the full list when `items[]` is available. That creates asymmetry and invites first-item overfocus.

When reviewed items exist, prompt context should emit a block similar to:

```text
- Itens da SD revisados: 5
- Lista de itens da SD:
  1. 0005909 - Pote plastico ... | qtd. 550 UN | unitario 0,00 | total 0,00
  2. 0005910 - Kit com 2 unidades ... | qtd. 550 KIT | unitario 0,00 | total 0,00
```

When no reviewed item list exists, keep the current singular fallback lines:

```text
- Descricao do item da SD: ...
- Quantidade do item da SD: ...
- Unidade do item da SD: ...
```

Alternative considered: remove legacy singular fields entirely. Rejected because older processes and backend-only intake can still depend on those fields.

### Decision: Add context fields instead of changing public APIs

Extend the internal generation contexts with fields such as:

- `sourceItems`: normalized item rows
- `sourceItemsCount`: number of normalized rows
- `sourceItemsSummary`: prompt-ready multiline list or null
- `hasSourceItems`: boolean

These are internal to prompt assembly and tests. They do not alter API response schemas or database records.

Alternative considered: add a normalized `process_items` table and load it during generation. Rejected as a larger product/data-model change than needed for the immediate document quality issue.

### Decision: Use full item text for inference, not just the first item

Any document-generation inference currently based on `itemDescription`, such as ETP analysis profile selection, should use the combined process object, justification, and reviewed item descriptions when `items[]` exists. This avoids treating the first row as the whole object.

Alternative considered: keep first-item inference and only change prompt display. Rejected because hidden inference would still be biased toward the first item.

### Decision: Keep item evidence factual and bounded

The item list should preserve reviewed row facts and avoid semantic recategorization. Formatting should cap or compact very long descriptions if needed for prompt size, but must not drop whole rows silently. If truncation is needed, the line should make that visible.

Alternative considered: send raw JSON directly to the provider. Rejected because a concise human-readable block is easier for prompts to follow and easier for tests to assert.

### Decision: Recipe guidance must be proportional by document type

Recipes/instructions should guide each document type to use the item list differently:

- DFD: use the list to understand the demand as a whole; do not enumerate every detail unless naturally necessary.
- ETP: use the list to analyze alternatives, need, and feasibility without inventing items outside the SD.
- TR: use the list for object/specification, delivery, receiving, and obligations where relevant.
- Minuta: use the list for contractual object and execution clauses without copying TR-level technical detail into the contract.

Alternative considered: one identical instruction for all documents. Rejected because DFD and TR have different drafting depth.

## Risks / Trade-offs

- [Risk] Prompt size grows for large SDs. -> Mitigation: use concise item lines and visible truncation for very long descriptions.
- [Risk] The model may over-enumerate DFD content after seeing all items. -> Mitigation: DFD recipe guidance should keep the document administrative and proportional.
- [Risk] Existing tests expect singular item lines. -> Mitigation: update tests to cover both branches: reviewed list and legacy fallback.
- [Risk] Older processes without `items[]` could lose context. -> Mitigation: keep the singular fallback path unchanged when the list is absent or empty.
- [Risk] Item totals may be incomplete or zeroed in SD metadata. -> Mitigation: show available per-item values as evidence, but do not infer an aggregate estimate from them in this change.

## Migration Plan

No data migration is required. New processes with reviewed items already store the list in `sourceMetadata.extractedFields.items`; older processes continue to use legacy singular metadata.

Implementation can be deployed as a backend-only prompt/context change. Rollback is to remove the reviewed-item prompt branch and return to the existing singular item lines.

## Open Questions

- Should very large item lists be capped by item count, or should every top-level row always be included with shorter descriptions?
- Should future process detail/edit screens expose item metadata updates after process creation?
- Should a later backend direct-PDF-intake change generate the same `items[]` metadata for API-created processes?
