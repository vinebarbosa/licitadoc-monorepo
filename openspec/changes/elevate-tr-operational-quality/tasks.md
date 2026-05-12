## 1. TR Editorial Recipe

- [x] 1.1 Update `apps/api/src/modules/documents/recipes/tr.instructions.md` to define TR as the technical-operational document of the contracting process.
- [x] 1.2 Add the central rule that the TR must operationalize without inventing facts.
- [x] 1.3 Replace dry missing-data guidance with conservative operational structuring guidance.
- [x] 1.4 Strengthen anti-hallucination rules for rider, duration, quantities, deadlines, payment terms, sanctions, percentages, SLA, price research, supplier credentials, legal grounds, budget data, and execution details.
- [x] 1.5 Expand type-specific operational guidance for artistic presentations, IT/software, consulting/advisory, goods supply, equipment rental, events, works/engineering, and general services.

## 2. TR Template

- [x] 2.1 Update `apps/api/src/modules/documents/recipes/tr.template.md` section 1 to make the object direct, operational, and connected to execution without repeating ETP analysis.
- [x] 2.2 Update section 2 so the justification is practical, objective, and focused on operational need.
- [x] 2.3 Rework section 3 so technical specifications become the main operational section, covering execution dynamics, requirements, interfaces, responsibilities, delivery/performance conditions, and future alignments.
- [x] 2.4 Rework sections 4 and 5 so contractor and contracting authority obligations are executable, fiscalizable, proportional, and not minuta-style legal clauses.
- [x] 2.5 Improve sections 6, 7, 8, 9, and 10 for execution period, value/budget, payment, management/fiscalization, and sanctions with operational but conservative wording.

## 3. Prompt Assembly Safeguards

- [x] 3.1 Review TR prompt assembly in `apps/api/src/modules/documents/documents.shared.ts` for final rules that may still leave the TR too generic or too ETP/minuta-like.
- [x] 3.2 Add concise final TR rules if needed to enforce operational role, technical specifications depth, executable obligations, fiscalization, conservative payment, and no invented details.
- [x] 3.3 Preserve existing cross-document separation rules so TR output does not include DFD, ETP, or minuta headings.

## 4. Tests

- [x] 4.1 Update repository-managed TR recipe tests to assert operational role guidance, "operationalize without inventing", and strengthened missing-data wording.
- [x] 4.2 Add or update prompt tests for stronger technical specifications, executable obligations, payment after verification/ateste, management/fiscalization, and sanctions without invented penalties.
- [x] 4.3 Cover representative TR scenarios: artistic presentation, IT/software service, consulting or HR advisory, goods supply, equipment rental, event operation, and works/reform.
- [x] 4.4 Verify tests continue to reject ETP-style analysis, minuta-style legalism, generic checklist behavior, and unsupported factual claims.

## 5. Validation

- [x] 5.1 Run `openspec validate elevate-tr-operational-quality --strict`.
- [x] 5.2 Run focused backend document generation recipe or prompt tests.
- [x] 5.3 Run API typecheck or the closest existing validation command if prompt-related TypeScript files are changed.
