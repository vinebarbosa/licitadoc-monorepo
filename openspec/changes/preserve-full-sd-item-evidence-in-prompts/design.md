## Context

The previous item-structure change introduced structured SD item parsing and `objectSemanticSummary`, but the real Kit Escolar SD shows two remaining failures:

- extraction still creates false top-level items from page headers and continuation fragments, such as address blocks and `Pág.: 2/4`;
- prompt assembly still sends the legacy `item.description` field, which contains a very detailed first item, while the rest of the SD appears only through flattened labels and semantic groups.

That creates an asymmetric prompt:

```text
first item          -> long detailed legacy description
other line items    -> compact labels or deduplicated component names
semantic summary    -> grouped categories
```

The AI can therefore produce a document that looks coherent at a high level but still feels like it understood only the first item deeply. The system needs a prompt-facing item evidence layer that preserves the SD hierarchy without asking the final document to reproduce every specification.

## Goals / Non-Goals

**Goals:**

- Preserve clean top-level SD line items through intake, semantic summary, and document prompt assembly.
- Remove page/header/footer noise from item labels before semantic consolidation.
- Preserve the relationship between each top-level item and its own components.
- Provide document prompts with a bounded `objectItemEvidence` block or equivalent structure.
- Keep DFD descriptions administrative and aggregated while still giving the model visibility into all line items.
- Give ETP/TR/Minuta enough structured evidence to discuss composition proportionally.
- Stop making `item.description` the dominant item signal when structured `items[]` exists.
- Expose diagnostics when item parsing is incomplete, contaminated, or falls back to legacy evidence.

**Non-Goals:**

- Do not make the DFD list every component or technical specification.
- Do not switch generation providers as part of this change.
- Do not create object-specific parsing logic for "kit escolar" only.
- Do not store raw full SD text in public API responses.
- Do not require a database migration unless JSON source metadata proves insufficient.

## Decisions

### Decision: Add a prompt-facing item evidence block

Document prompts should receive a compact structured block, tentatively named `objectItemEvidence`, derived from `sourceMetadata.extractedFields.items`.

Example shape:

```text
- objectItemEvidence.available: sim
- objectItemEvidence.itemCount: 3
- objectItemEvidence.items:
  1. KIT ESCOLAR: EDUCAÇÃO INFANTIL | qtd. 550 KIT | componentes: caderno com brochura; lápis grafite; borracha; giz de cera; cola; lápis de cor; massa de modelar; tinta guache; toalha; squeeze
  2. KIT ESCOLAR: ENSINO FUNDAMENTAL I (ALFABETIZAÇÃO 1º AO 2º ANO) | qtd. 300 KIT | componentes: ...
  3. KIT ESCOLAR: ENSINO FUNDAMENTAL I (SISTEMATIZAÇÃO 3º, 4º E 5º ANO) | qtd. 470 KIT | componentes: ...
```

This block should be generated deterministically by application code. It is evidence for the model, not final text. It should avoid full specification prose, values, and attributes unless a document type requires them.

Alternative considered: put full raw `items[]` JSON into every prompt. Rejected because it is verbose, less readable for prompt following, and can pull DFD output into item-by-item specification.

### Decision: Keep hierarchical evidence separate from semantic labels

`objectSemanticSummary` should keep its role: object type, summary label, primary groups, component families, flags, and diagnostics. The new evidence block should keep the actual SD line-item hierarchy.

```text
objectSemanticSummary  -> "what is this object semantically?"
objectItemEvidence     -> "what exactly did the SD item table contain?"
```

This separation avoids turning semantic grouping into the only source of item visibility.

Alternative considered: add more arrays to `objectSemanticSummary` until it contains everything. Rejected because it overloads a summary model with evidence transport responsibilities.

### Decision: Suppress legacy first-item prompt fields when structured evidence exists

When `objectItemEvidence.available` is true, prompt assembly should not include `Descrição do item da origem` as a long first-item field. The legacy item can remain in stored metadata for compatibility, but the provider prompt should either omit it or label it clearly as legacy representative evidence that must not dominate the object.

Alternative considered: keep the legacy field and add stronger instructions not to overuse it. Rejected because the model will still see one item in far greater detail than the rest.

### Decision: Improve structural cleanup before item segmentation

PDF/text intake should normalize repeated page artifacts before line-item segmentation. Cleanup should target structural noise, not procurement vocabulary:

- page numbers such as `Pág.: 2/4`;
- repeated address/CNPJ/header blocks;
- system footer/header phrases;
- continuation artifacts that appear between row values and the next actual line-item label.

The parser should validate candidate line items by requiring a real row-value association when possible: code, quantity, unit, unit value, or total value. Continuation fragments without row evidence should attach to the current/previous item as component/specification evidence, not become new top-level items.

Alternative considered: ignore all PDF line/page artifacts and parse one normalized string. Rejected because the parser needs some boundaries to distinguish rows and components.

### Decision: Keep document-specific detail budgets

The same item evidence should be formatted differently by document type:

- DFD: line item labels and compact component examples/families; no exhaustive item-level prose.
- ETP: item labels and component families enough for technical analysis.
- TR: richer component evidence for specifications, delivery, conformity, and receiving.
- Minuta: line item labels and aggregate composition enough for contractual object/execution clauses, without becoming TR.

Alternative considered: one identical evidence block for all documents. Rejected because DFD and TR need different levels of detail.

### Decision: Diagnostics must name where evidence degraded

Diagnostics should distinguish:

- `structured_item_evidence_available`;
- `structured_item_evidence_contaminated`;
- `item_row_values_missing`;
- `item_components_partial`;
- `legacy_item_description_suppressed`;
- `legacy_item_description_fallback_used`.

This helps decide whether a bad document is caused by extraction, semantic summary, recipe behavior, or provider behavior.

Alternative considered: a single generic warning. Rejected because the current debugging problem is precisely not knowing which layer lost the evidence.

## Risks / Trade-offs

- [Risk] Some SD layouts may not provide reliable row values. -> Mitigation: preserve fallback behavior, but mark prompts with evidence warnings and avoid pretending the structure is complete.
- [Risk] More item evidence increases prompt size. -> Mitigation: use document-specific detail budgets and cap component lists with clear truncation indicators.
- [Risk] Removing the legacy first-item description may reduce detail for unitary objects. -> Mitigation: suppress it only when structured item evidence is available and reliable.
- [Risk] Cleanup might remove meaningful text that resembles headers. -> Mitigation: target repeated structural patterns and cover with regression tests.
- [Risk] The AI may still over-detail when components are visible. -> Mitigation: recipes should distinguish evidence from drafting level and tests should assert prompt guidance for each document type.

## Migration Plan

No database migration is expected. Existing processes with only legacy `item.description` continue to use fallback behavior. New or re-imported SDs receive cleaner structured item evidence.

Rollback is straightforward: document prompts can fall back to the current `objectSemanticSummary` lines and legacy item fields if the new item evidence builder is disabled or returns unavailable.

## Open Questions

- Should `objectItemEvidence` include per-component quantities when present, or only labels for DFD and ETP?
- Should TR receive full component attributes/specifications, or only labels plus a separate "attributes available" diagnostic?
- Should the UI expose item-evidence diagnostics to the operator, or should this remain internal for now?
