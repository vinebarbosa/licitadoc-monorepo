## Context

The DFD generator currently uses a repository-managed instruction file and canonical Markdown template. Previous quality work made the DFD more subject-aware and review-ready, which improved generic output but also made the document more likely to sound like a shortened ETP: more analytical, more strategic, and more technical than the DFD's procedural role requires.

The DFD should remain the initial document that formalizes demand. It should register who is requesting, what is being requested, why the demand exists, what administrative problem must be addressed, what happens if it is not addressed, and what minimum requirements should guide later instruction. It should not perform market study, alternative analysis, risk matrix, fiscalization planning, contractual obligation drafting, or legal/economic conclusions.

## Goals / Non-Goals

**Goals:**

- Keep the existing canonical DFD structure: request data, demand context, object, initial justification, essential requirements, and closing.
- Reduce DFD analytical depth to a moderate, initial-demand level while preserving formal quality and context fidelity.
- Add explicit recipe rules distinguishing DFD from ETP, TR, minuta, legal opinion, and feasibility study.
- Limit narrative sections to 1-2 paragraphs in ordinary cases.
- Keep requirements short, minimum, and essential, usually 3-6 bullets.
- Preserve anti-hallucination behavior around values, dates, duration, supplier attributes, exclusivity, market research, budget data, and legal grounds.
- Add tests that check DFD prompt/recipe contract across representative categories.

**Non-Goals:**

- Do not change public document APIs, storage, streaming, provider configuration, or frontend behavior.
- Do not make DFD generation lower quality or informal.
- Do not remove object-aware wording entirely; only keep it proportional to DFD scope.
- Do not add ETP sections, TR clauses, price methodology, risk matrices, fiscalization plans, or contract obligations to DFD.
- Do not create separate DFD templates per category.

## Decisions

### Decision: Keep the DFD template structure but tighten the guidance

The current six-section DFD structure is correct. The implementation should refine the wording inside the instruction and template assets rather than introduce new sections. This preserves downstream assumptions and keeps DFD recognizably concise.

Alternatives considered:

- Add explicit "limits" sections to the DFD template.
  Rejected because that would make the generated document less formal and could leak meta-instructions into final output.
- Split DFD into category-specific templates.
  Rejected because the issue is document role, not category routing.

### Decision: Treat DFD as initial formalization, not planning analysis

The DFD recipe should state that the document formalizes the demand and records initial justification. It must avoid ETP/TR behaviors: market methodology, alternatives, risks, fiscalization, obligations, payment criteria, measurement criteria, SLA, economicity, vantajosidade, legal opinions, and feasibility conclusions.

This decision gives DFD a clear identity after the ETP recipe has become more robust.

### Decision: Size controls should be prompt rules, not runtime post-processing

The generator should guide the model toward 1-2 paragraphs in context/object/justification and 3-6 requirement bullets. Post-processing generated text by truncating would be brittle and could remove necessary facts. Tests should assert the prompt contract rather than exact generated length.

### Decision: Simplify category guidance

DFD still needs subject-aware requirements, but category guidance should be limited to minimum administrative considerations. For example:

- Cultural event: object, public access, event context when present, basic safety/adequacy.
- Administrative service: need, support/continuity, capacity, confidentiality when applicable.
- Goods/equipment: specification, quantity/unit when provided, delivery, suitability, quality.
- Technology: continuity, support, security when directly relevant.
- Works/reform: location when provided, basic safety, technical adequacy.

The DFD should not expand these into execution plans or feasibility studies.

### Decision: Tests should protect role separation

Tests should assert that the recipe/prompt:

- identifies DFD as initial formalization
- discourages ETP/TR content by name
- includes size guidance
- keeps requirements to 3-6 short bullets
- avoids market methodology, alternatives, risk matrix, fiscalization planning, obligations, payment/measurement criteria, SLA, and legal/economic conclusions
- still preserves safe handling for missing values and context-only facts

## Risks / Trade-offs

- [Risk] Smaller DFD guidance can make output too thin. -> Mitigation: require enough context to justify the demand while limiting analytical depth.
- [Risk] Strong prohibitions may prevent useful object-specific details. -> Mitigation: allow minimum essential requirements directly tied to the object and context.
- [Risk] The model may still produce ETP-like prose due to prior instructions or operator prompts. -> Mitigation: add final prompt rules making DFD role separation explicit and tests that assert those rules.
- [Risk] Tests may overfit to wording. -> Mitigation: assert durable phrases and structural constraints, not full generated prose.

## Migration Plan

1. Update `dfd-instructions.md` with DFD role, size, simplicity, and anti-ETP/TR constraints.
2. Update `dfd-template.md` to tighten section guidance and remove wording that implies deep legal/economic analysis.
3. Add final DFD prompt rules in `documents.shared.ts` if current final rules do not explicitly enforce role separation and size.
4. Update focused recipe and prompt tests across representative DFD object categories.
5. Run OpenSpec validation, focused backend document generation tests, and API typecheck.
6. Rollback by restoring prior DFD recipe assets and prompt rules; no data migration is required.

## Open Questions

- Should later work add a visual or UI hint explaining document roles to users before generation?
- Should custom operator instructions be constrained when they ask a DFD to include ETP/TR content?
