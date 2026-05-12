## Context

The TR generator currently has a repository-managed instruction file and canonical Markdown template. It is correctly separated from DFD and ETP and includes anti-hallucination safeguards, but the generated document can remain too defensive and generic. In practice, it often records missing data instead of structuring how execution, responsibilities, payment, acceptance, and fiscalization should work at a conservative and revisable level.

The user's target is not a longer TR for its own sake. The target is an operational TR: a document that makes the future contract understandable, executable, and fiscalizable while avoiding invented details. The TCU reference cited by the user treats the TR as the planning document that details the chosen solution and explains execution, management, payment, and fiscalization, which matches this change's intended direction.

The existing ecosystem now has clearer role separation:

- DFD formalizes the initial demand.
- ETP analyzes viability, alternatives, risks, and planning depth.
- TR operationalizes the chosen contracting path.
- Minuta formalizes contract clauses.

This change should keep that separation intact.

## Goals / Non-Goals

**Goals:**

- Make TR generation behave as a technical-operational contracting document.
- Strengthen the TR recipe with the principle "operationalize without inventing".
- Improve operational depth in technical specifications, contractor obligations, contracting authority obligations, payment conditions, and management/fiscalization.
- Replace dry absence language with conservative operational structuring when details are missing.
- Expand type-aware operational guidance for artistic presentations, IT/software, consulting/advisory, goods supply, equipment rental, events, works/engineering, and general services.
- Preserve all current anti-hallucination protections for values, deadlines, quantities, locations, technical riders, payment terms, sanctions, SLA, price research, supplier credentials, legal grounds, and facts not present in context.
- Add tests that make TR role separation and operational quality durable.

**Non-Goals:**

- Do not change public APIs, database schema, document lifecycle, provider configuration, or frontend behavior.
- Do not transform the TR into ETP, legal opinion, contract minuta, or generic checklist.
- Do not add unsupported legal conclusions, legal article citations, sanctions, percentages, payment deadlines, SLA, technical riders, durations, cronograms, or supplier credentials.
- Do not create separate TR templates per type.
- Do not remove the canonical TR section structure unless implementation reveals a necessary local alignment issue.

## Decisions

### Decision: Keep the canonical TR structure and enrich section guidance

The current TR section layout is usable and already integrated into prompt assembly and tests. The implementation should preserve the visible structure and improve the editorial instructions inside `tr.instructions.md` and `tr.template.md`.

Alternatives considered:

- Add many new TR sections.
  Rejected because it increases downstream churn and risks making the document look like a template checklist.
- Replace the template with a category-specific template system.
  Rejected because the problem is operational behavior, not routing.

### Decision: Use "operationalize without inventing" as the main prompt rule

The prompt should explicitly teach the model to structure execution even when facts are incomplete. Instead of writing only "not informed", the TR should describe that definitions of infrastructure, logistics, execution flow, support, documentation, and communication must be aligned before execution, always without inventing the missing values.

This keeps safety while improving usefulness. The model may describe the administrative process for later definition, but it must not fabricate what the later definition will be.

### Decision: Make technical specifications the operational center of the TR

`ESPECIFICAÇÕES TÉCNICAS` should become the strongest operational section. It should guide:

- execution dynamics
- operational requirements
- responsibilities and interfaces
- conditions of delivery/performance
- alignment before execution
- documentation and evidence where relevant
- conservative handling of absent details

The implementation should discourage vague bullets such as "execute with quality" or "when applicable" when a more operational and still safe formulation is possible.

### Decision: Obligations should be operational, not legalistic

The contractor and contracting authority obligation blocks should describe practical responsibilities that can be executed and inspected. They should consider logistics, communication, support, schedule alignment, conformity, evidence, correction of failures, and integration with the administrative routine when compatible with the object.

They should not become minuta clauses. The minuta remains responsible for formal contractual wording and legal modularity.

### Decision: Type-specific guidance should be richer but conditional

The current type blocks are helpful but shallow. Implementation should expand them into operational axes by type:

- Artistic presentation: logistics, sound check or operational alignment, stage/structure interface, technical support, event communication.
- IT/software: implementation, integration, support, availability expectations, security, LGPD relevance, training, maintenance.
- Consulting/advisory: deliverables, reports, meetings, schedule, technical validation, information flow.
- Goods supply: delivery, receiving, conformity, substitution, warranty or support when supported by context.
- Equipment rental: availability, installation or delivery, support, replacement, conservation, return.
- Events: operation, coordination, cronogram, suppliers, safety, communication.
- Works/engineering: cronogram, measurements, technical responsibility, conformity, safety, materials.
- General services: routine, team, supplies, communication, supervision, corrective action.

Every item must remain conditional on the object and context. The recipe should prohibit copying type examples that do not fit.

### Decision: Add final prompt safeguards only if needed

If `documents.shared.ts` final TR rules can still pull the output toward ETP or leave it too generic, implementation should add concise final rules reinforcing:

- TR as operational document
- execution/fiscalization/payment/obligations focus
- no ETP analysis
- no minuta legalism
- missing details handled through operational alignment, not invented facts

If the recipe and template already fully cover this after edits, code changes can remain limited to recipe assets and tests.

## Risks / Trade-offs

- [Risk] Operational guidance may invite invented execution details. -> Mitigation: pair every operational instruction with context-only constraints and examples of future alignment without fabricated values.
- [Risk] The TR may become too long or checklist-like. -> Mitigation: require proportional depth, narrative where useful, and type-specific adaptation instead of mechanical copying.
- [Risk] Stronger obligations may resemble contract minuta clauses. -> Mitigation: keep obligations practical and inspectable, leaving formal legal clauses to the minuta.
- [Risk] Tests may overfit to exact wording. -> Mitigation: assert durable role, section, and prohibition signals rather than full generated prose.

## Migration Plan

1. Update `apps/api/src/modules/documents/recipes/tr.instructions.md` with the TR role, operationalization principle, improved missing-data guidance, richer type-specific operational axes, and preserved anti-hallucination rules.
2. Update `apps/api/src/modules/documents/recipes/tr.template.md` to strengthen section-by-section guidance, especially technical specifications, obligations, payment, and management/fiscalization.
3. Review `apps/api/src/modules/documents/documents.shared.ts` and add final TR prompt safeguards if the shared prompt does not clearly enforce operational role separation.
4. Update focused document-generation recipe tests for TR assets and representative contracting types.
5. Run OpenSpec validation, focused backend tests, and API typecheck.
6. Roll back by restoring prior TR recipe assets and final prompt rules; no data migration is required.

## Open Questions

- Should custom operator instructions be constrained when they ask for ETP-style analysis or minuta-style legal clauses inside the TR?
- Should future UI copy explain the DFD/ETP/TR/minuta roles before generation so users set better expectations?
