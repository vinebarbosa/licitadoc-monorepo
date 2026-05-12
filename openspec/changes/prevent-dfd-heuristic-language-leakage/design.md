## Context

The current document generation pipeline has a useful internal object consolidation summary. It distinguishes unitary and `multi_item` objects, tracks a dominant source item, exposes item groups, and records guidance/rationale used by prompts.

That structure is appropriate internally and remains useful for ETP, TR, Minuta, and tests. The DFD, however, is the most introductory and document-facing artifact. When DFD prompts expose labels like "Tipo de consolidação", "Item dominante", "Grupos de itens identificados", "Orientação de consolidação", or "Racional da consolidação", the model can accidentally reuse those terms in the final DFD. The result sounds like the document is describing the generator's reasoning instead of the administrative demand.

## Goals / Non-Goals

**Goals:**

- Prevent internal consolidation vocabulary from appearing as likely drafting material in DFD prompts.
- Keep object consolidation logic and metadata available internally.
- Provide a DFD-safe object context with document-facing labels and values.
- Preserve concrete item groups, suggested object wording, and existing multi-item safeguards.
- Update DFD recipe guidance to prohibit final text that explains heuristics or generator decisions.
- Add tests that reject DFD prompt leakage of heuristic labels while confirming useful concrete materials remain available.

**Non-Goals:**

- Do not change object consolidation classification or item-group detection.
- Do not change ETP, TR, or Minuta prompt behavior.
- Do not remove source traceability from internal context objects.
- Do not reintroduce quantities, units, values, first-item bias, or generic over-abstraction.
- Do not change public APIs, database schema, provider contracts, or document structure.

## Decisions

### Decision: Add a DFD-safe adapter instead of mutating `ObjectConsolidationSummary`

Implementation should keep `ObjectConsolidationSummary` as the internal representation and derive a small DFD-specific view during DFD prompt assembly.

The DFD-safe view should expose document-facing concepts such as:

- materials or item groups to mention in the DFD;
- suggested administrative object wording;
- source-grounded drafting cautions;
- optional plain-language note that item-level details belong elsewhere.

It should not expose terms such as `dominantItem`, `rationale`, `guidance`, "consolidação", "agrupamento", "item dominante", or "grupos identificados" as prompt labels.

Alternative considered: rename fields inside `ObjectConsolidationSummary`. Rejected because those fields are accurate for internal reasoning and are already shared with other document types.

### Decision: Keep internal heuristics visible to non-DFD prompts for now

This change is scoped to DFD. ETP, TR, and Minuta may still use the internal consolidation summary because their prompts may benefit from more explicit operational and contractual reasoning.

Alternative considered: introduce safe views for all document types. Rejected as broader than the current observed problem and likely to disturb recently tuned TR/ETP/Minuta behavior.

### Decision: Remove heuristic labels from DFD prompt, not only forbid them in recipe text

Recipe guidance should state that the final DFD must not explain generator decisions, but the more important fix is to stop placing heuristic labels directly in the DFD prompt context.

Alternative considered: only add negative instructions such as "do not mention item dominante". Rejected because that still exposes the model to the exact vocabulary most likely to leak.

### Decision: Use positive document-facing labels

DFD prompt labels should sound like source facts or drafting aids, not system internals. Examples:

- "Materiais a mencionar no DFD"
- "Objeto administrativo sugerido"
- "Cuidados de redação do DFD"
- "Detalhes item a item"

These labels let the model use the result of consolidation without verbalizing the consolidation process.

## Risks / Trade-offs

- [Risk] Removing internal labels may reduce debuggability of DFD prompts. -> Mitigation: keep internal fields in the context object and tests; only change the DFD prompt display.
- [Risk] Tests may accidentally ban words that can be valid in source content. -> Mitigation: assert against heuristic prompt labels and generator-explanation phrases, not all occurrences of common words in user-provided source text.
- [Risk] DFD prompt may lose useful multi-item context. -> Mitigation: keep concrete materials and suggested object wording in the DFD-safe view.
- [Risk] Recipe wording could still contain banned terms as examples and be copied by the model. -> Mitigation: phrase recipe cautions as output rules and avoid repeated heuristic vocabulary where possible.
