## Context

The current DFD generation flow already distinguishes unitary and `multi_item` objects, preserves concrete item groups, and prevents item quantities or first-line specifications from leaking into the DFD object and essential requirements.

The remaining problem is editorial: some DFDs still use abstract or overly polished phrases that sound artificial for a simple demand formalization document. The DFD should name the concrete groups available in the SD and keep the prose plain, administrative, and proportional. It must not infer operational conditions such as hygiene, technical protection, or expanded safety unless those details are explicitly supported by the source context.

## Goals / Non-Goals

**Goals:**

- Make multi-item DFD wording more natural, concrete, and administratively simple.
- Keep concrete SD groups such as recipientes, kits, embalagens, fitas, acessórios, and materiais auxiliares visible when present.
- Reduce abstract institutional expressions when concrete group names are available.
- Prevent unsupported operational inferences in DFD object, justification, and essential requirements.
- Keep requirements general, short, proportional, and less TR-like.
- Preserve existing aggregation, lexical fidelity, and no-quantity behavior.

**Non-Goals:**

- Do not change DFD structure or section count.
- Do not change object consolidation heuristics or source extraction.
- Do not reintroduce quantities, units, lots, values, or detailed specifications into the DFD.
- Do not affect ETP, TR, or Minuta recipes.
- Do not add density, sophistication, complexity profiles, or new document-generation architecture.

## Decisions

### Decision: Treat naturalness as recipe and prompt guidance, not a new consolidation algorithm

Implementation should update DFD editorial instructions and template examples first. If needed, DFD prompt assembly may add a short `multi_item` naturalness rule alongside the existing quantity-suppression rule.

Alternative considered: change item-group detection or consolidated object generation. Rejected because the current issue is wording style after correct grouping, not semantic classification.

### Decision: Prefer concrete group names over abstract connector phrases

For multi-item DFDs, the recipe should tell the model to use terms already present or safely normalized from the SD, such as "kits, embalagens e materiais auxiliares", instead of umbrella phrases like "demais grupos materiais diretamente relacionados".

Alternative considered: maintain broad abstract vocabulary to improve generality. Rejected because it produces artificial prose and weakens source fidelity in simple DFDs.

### Decision: Explicitly block unsupported operational enrichment

The DFD guidance should prohibit inferred hygiene, technical protection, expanded safety, secure delivery, or similar operational claims unless those details appear in the context. General phrases such as "condições adequadas de uso e fornecimento" are acceptable because they remain administrative and conservative.

Alternative considered: rely only on existing anti-hallucination rules. Rejected because the observed issue is subtle editorial enrichment that may not look like a factual invention unless examples are named directly.

### Decision: Keep essential requirements simple and group-level

Requirement examples should stay short and practical, using language such as "materiais em condições adequadas de uso e fornecimento" and "acondicionamento e distribuição dos materiais" when supported. They should avoid compliance-heavy, technical, or safety-specific wording that belongs in TR or requires source support.

Alternative considered: add richer requirement examples for perceived quality. Rejected because this change is specifically about reducing artificial sophistication.

## Risks / Trade-offs

- [Risk] Simpler DFD prose may feel less polished. -> Mitigation: preserve formal administrative tone while avoiding abstract filler.
- [Risk] Over-blocking terms such as "segurança" could remove valid context. -> Mitigation: prohibit these only when unsupported; allow them when the SD or source context clearly provides the detail.
- [Risk] Tests may overfit a few banned phrases. -> Mitigation: test both negative phrases and positive concrete alternatives such as kits, embalagens, materiais auxiliares, acondicionamento, and distribuição.
- [Risk] Prompt-level guidance may duplicate recipe text. -> Mitigation: keep any context-level rule short and scoped only to `multi_item` DFDs.
