## Context

The backend already derives an `ObjectConsolidationSummary` while assembling document prompts. That helper lives inside `documents.shared.ts` and mixes detection signals, display labels, DFD-specific drafting safeguards, prompt guidance, and explanatory rationale in the same structure. DFD, ETP, TR, and Minuta currently receive fields such as dominant item, consolidation guidance, and rationale, which creates room for heuristic leakage and encourages each document prompt to continue editorial reasoning about the object while drafting.

The requested architecture separates semantic interpretation from document writing:

1. Raw SD/process context.
2. `objectSemanticSummary`.
3. Document prompt assembly and final drafting.

The intermediate layer must be reusable, structured, concrete, and source-grounded. It must not produce final DFD, ETP, TR, Minuta, legal, contractual, or institutional prose.

## Goals / Non-Goals

**Goals:**

- Introduce an internal `ObjectSemanticSummary` model for the semantic interpretation of the contracting object.
- Use SD item evidence, structured item arrays, extracted fields, process object, and justification to identify unitary versus multi-item objects.
- Preserve lexical fidelity by keeping concrete source item labels and conservative material groups visible.
- Identify primary material groups, complementary items, accessories, dominant purpose, and safe reusable labels.
- Feed DFD, ETP, TR, and Minuta from the same semantic summary fields.
- Remove prompt-facing heuristic/rationale fields that invite final documents to explain how the system interpreted the demand.
- Keep unitary object behavior stable.

**Non-Goals:**

- Do not add `complexityProfile` or another style-tuning mechanism.
- Do not add a new provider/model call for semantic summarization in this change.
- Do not persist the summary in the database or change public API contracts.
- Do not generate final document prose, legal text, institutional narrative, or section-specific paragraphs inside the semantic layer.
- Do not introduce a broad procurement taxonomy detached from source item evidence.
- Do not solve OCR or SD item extraction quality beyond consuming already available extracted fields and structured item arrays.

## Decisions

### Decision: Replace prompt-facing consolidation with an internal semantic-summary model

Create a dedicated internal type, for example `ObjectSemanticSummary`, with fields such as:

- `objectType`: compact classification such as `unitary_supply`, `multi_item_supply`, `service`, `works`, or `unknown`.
- `primaryGroups`: concrete material groups grounded in source item labels.
- `sourceItemLabels`: normalized labels or descriptions extracted from the SD.
- `summaryLabel`: short reusable object label, not a paragraph.
- `containsComplementaryItems`: boolean.
- `containsAccessories`: boolean.
- `shouldAvoidItemLevelDetail`: boolean.
- `shouldAvoidQuantitativeMention`: boolean.
- `dominantPurpose`: short purpose label when supported by process context.

The structure may retain internal diagnostic metadata for tests or debugging, but document prompts must receive only the fields meant for drafting context.

Alternative considered: continue extending `ObjectConsolidationSummary` with more guidance strings. Rejected because the existing shape already exposes rationale and drafting instructions to final prompts, which is the coupling this change is intended to remove.

### Decision: Keep the first implementation deterministic

Implement the semantic summary as a backend function built from current process/source metadata, structured item arrays, extracted item fields, process object, and justification. This avoids extra latency, provider variability, JSON repair logic, and database persistence needs.

Alternative considered: add a separate LLM call that returns JSON. Rejected for this change because the system already has enough structured evidence for the known failure cases, and another generative step would add instability unless guarded by schema validation, retries, and telemetry.

### Decision: Treat purpose as context, not material grouping evidence

Purpose terms such as distribution, commemorative action, event, or institutional campaign may support `dominantPurpose` or `summaryLabel`. They must not create primary material groups such as "materiais de apoio", "insumos operacionais", or "componentes logísticos" unless those labels or equivalent concrete material items are present in the SD.

Alternative considered: use purpose keywords to infer parent categories. Rejected because this is the current source of artificial abstractions and category drift.

### Decision: Make lexical evidence stronger than normalized labels

The semantic builder should first collect source item labels and then map them to conservative concrete groups. Normalization is acceptable when it preserves meaning, such as potes/recipientes/vasilhas to "recipientes plásticos" when the material evidence supports it, kits to "kits compostos", embalagens to "embalagens", and fitas/adesivos to "materiais auxiliares de acondicionamento".

Generic labels are allowed only when the source itself uses them or when the mapped group remains materially concrete and traceable to item labels.

Alternative considered: define a large controlled taxonomy of procurement categories. Rejected because it risks abstraction away from SD vocabulary and expands scope beyond the requested semantic layer.

### Decision: Document prompts consume summary fields, not reasoning fields

DFD, ETP, TR, and Minuta prompts should receive the same `objectSemanticSummary` context:

- object type;
- primary groups;
- summary label;
- dominant purpose;
- flags for item-level and quantitative detail;
- accessory/complementary signals.

Prompts should not include dominant-item wording, consolidation rationale, grouping mechanics, or instructions that explain the helper. Recipes can instruct each document family how to use the summary, but they must not ask the model to reinterpret SD items independently.

Alternative considered: keep existing prompt context and add stronger "do not leak heuristics" instructions. Rejected because the prompt would still contain the very heuristic terms that can leak into generated text.

## Risks / Trade-offs

- [Risk] A deterministic summary may miss rare semantic relationships. -> Mitigation: keep source item labels visible and prefer conservative grouping over unsupported abstraction.
- [Risk] Removing rationale from prompts may make generated documents less "explanatory." -> Mitigation: documents still receive summary label, groups, purpose, and flags; they just do not receive internal reasoning.
- [Risk] Existing tests may assert old prompt strings such as `Tipo de consolidação do objeto` or `Item dominante`. -> Mitigation: update tests to assert the new shared semantic-summary context and absence of heuristic leakage.
- [Risk] Some SDs genuinely use generic labels. -> Mitigation: allow generic labels only when they are present in the source evidence, and add tests for both allowed and rejected cases.
- [Risk] The summary can become a hidden drafting layer if it starts producing paragraphs. -> Mitigation: constrain `summaryLabel` and purpose fields to compact labels and test that the semantic layer does not emit document-section prose.
