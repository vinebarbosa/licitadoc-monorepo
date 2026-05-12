## Context

The Minuta generator already has a repository-managed instruction file, a canonical Markdown template, prompt-level safeguards, and runtime enforcement for fixed clauses. This is the right foundation: the generator should not become a free-form contract drafter, and it should not overwrite legally stable clauses through model creativity.

The current weakness is in the variable surface. Object, execution, obligations, fiscalization, receipt, penalties, and related clauses are safe but often too abstract. They can sound like a well-organized template rather than a real administrative contract that formalizes the operation planned in the TR.

The intended role separation remains:

- DFD formalizes the administrative need.
- ETP analyzes feasibility and planning alternatives.
- TR operationalizes execution.
- Minuta formalizes that operation as a contractual bond.

Lei n. 14.133/2021 should remain a guardrail for contractual clarity, essential clauses, responsibilities, execution, payment, receipt, and administrative management. The recipe should not become a legal research engine or generate unsupported article-level conclusions.

## Goals / Non-Goals

**Goals:**

- Preserve the fixed/semi-fixed/conditional/contextual architecture already used by the Minuta recipe.
- Make variable clauses feel more like mature administrative contract clauses.
- Add reusable conditional modules by contracting type while keeping a single canonical Minuta template.
- Convert TR operational logic into contractual language without copying TR headings or writing a TR inside the contract.
- Improve missing-data handling with natural contractual wording and placeholders, without inventing values, terms, deadlines, technical facts, sanctions, or obligations.
- Strengthen tests around fixed clause stability, variable clause quality, type-aware modules, and anti-hallucination behavior.

**Non-Goals:**

- Do not change public APIs, database schema, document lifecycle, provider configuration, or frontend behavior.
- Do not replace the current Minuta architecture with fully separate templates per contracting type.
- Do not make fixed clauses creative or highly contextual.
- Do not transform the Minuta into TR, ETP, legal opinion, or a hyper-detailed legacy municipal contract.
- Do not introduce unsupported legal citations, sanctions, fine percentages, payment deadlines, SLA, cronogramas, technical riders, warranties, measurements, responsible professionals, or documents.

## Decisions

### Decision: Keep one canonical Minuta template with richer variable instructions

The implementation should preserve the existing canonical template and clause order. The improvement should happen by enriching clause guidance inside `minuta.instructions.md`, `minuta.template.md`, and final prompt rules, not by adding category-specific templates.

Alternatives considered:

- Create one template per contracting type.
  Rejected because it increases maintenance cost and weakens the current modular architecture.
- Let the model freely rewrite clauses by object type.
  Rejected because it threatens fixed clause stability and increases hallucination risk.

### Decision: Treat fixed clauses as legally stable assets

The current `FIXED_CLAUSE_START` / `FIXED_CLAUSE_END` flow should remain. The generator and sanitizer should continue preserving fixed clauses for prerogatives, alteration/readjustment, habilitation, publicity, omitted cases, and forum.

Implementation can adjust wording only if the fixed clause text itself is intentionally updated as part of a reviewed template change. Prompt instructions must still tell the model not to rewrite fixed clauses.

### Decision: Make semi-fixed clauses context-aware but bounded

The semi-fixed clauses should receive stronger instructions and safer clause text:

- object should name the contractual object and connect it to the administrative process without becoming justification;
- execution should describe the contractual execution dynamic at a moderate level;
- payment should remain tied to execution, fiscal documentation, liquidation, and ateste without invented deadlines or installments;
- term should preserve placeholders when dates are absent;
- obligations should be contractual, executable, fiscalizable, and type-aware;
- fiscalization should cover communication, records, conformity, validation, and corrective requests;
- receipt should cover conformity checks, acceptance/refusal, correction, and replacement/refazimento where compatible;
- penalties should read like a contract clause while staying generic and conservative;
- termination should remain legal and process-based without adding unsupported hypotheses.

### Decision: Add conditional modules by contracting type as reusable instruction blocks

`minuta.instructions.md` should introduce conditional contractual modules for:

- events and artistic presentations;
- software/IT;
- consulting/advisory;
- supply of goods;
- works/engineering;
- continuing/general services.

These modules should guide object, execution, obligations, fiscalization, receipt, and payment language. They should not be copied mechanically and should not authorize unsupported facts. If the contracting type is uncertain, the recipe should choose the conservative general service path and use conditional contractual wording.

### Decision: Expand prompt assembly only where final rules are still weak

If `documents.shared.ts` already preserves fixed clauses and supplies the inferred contracting type, implementation should keep code changes minimal. It may add concise Minuta final rules to reinforce:

- "formalize the TR operation";
- fixed clause stability;
- richer semi-fixed clauses;
- type-aware conditional modules;
- conservative placeholders and no invented facts;
- no DFD/ETP/TR headings.

Classifier changes should be considered only if representative types are not inferred accurately enough to select the intended modules.

## Risks / Trade-offs

- [Risk] Richer contractual texture may invite invented details. -> Mitigation: pair every contextual instruction with explicit no-invention rules and placeholder/future-definition language.
- [Risk] Variable clauses may become TR-like. -> Mitigation: require contractual verbs and legal-contractual framing, and prohibit TR headings, analysis, and long operational explanations.
- [Risk] Fixed clauses may drift during template edits. -> Mitigation: keep fixed markers and tests that compare or assert preservation of fixed clause blocks.
- [Risk] Conditional modules may be over-applied across unrelated objects. -> Mitigation: instruct type selection by predominant object and test representative scenarios for no incompatible module leakage.
- [Risk] The contract may become too long or bureaucratic. -> Mitigation: require proportional contextualization and moderate clause depth, not exhaustive operational detail.

## Migration Plan

1. Update `apps/api/src/modules/documents/recipes/minuta.instructions.md` with the central role rule, richer missing-data guidance, fixed/semi-fixed/conditional architecture, and type-specific contractual modules.
2. Update `apps/api/src/modules/documents/recipes/minuta.template.md` variable clauses while preserving fixed markers and fixed clause intent.
3. Review `apps/api/src/modules/documents/documents.shared.ts` for Minuta final prompt rules and type inference support; add only narrow safeguards if needed.
4. Update focused recipe and prompt tests for Minuta quality, type variation, fixed clause stability, placeholders, and anti-hallucination.
5. Run OpenSpec validation, focused backend document generation tests, and API typecheck if TypeScript prompt assembly changes.
6. Roll back by restoring prior Minuta recipe assets and final prompt rules; no data migration is required.

## Open Questions

- Should future changes pass generated TR content explicitly into Minuta context, or is the current process context sufficient for this iteration?
- Should custom operator instructions be constrained when they ask for detailed sanctions, specific payment deadlines, or TR-style operational sections inside the Minuta?
