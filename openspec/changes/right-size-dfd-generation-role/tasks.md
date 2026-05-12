## 1. DFD Editorial Recipe

- [x] 1.1 Update `apps/api/src/modules/documents/recipes/dfd-instructions.md` to define the DFD as an initial demand-formalization document.
- [x] 1.2 Add explicit prohibitions against ETP, TR, contract minuta, legal opinion, market study, feasibility study, and risk-analysis behavior.
- [x] 1.3 Add moderate-density guidance so the DFD remains formal and useful without becoming overly analytical.
- [x] 1.4 Simplify category-specific guidance so it only suggests essential administrative context and minimum requirements.

## 2. DFD Template

- [x] 2.1 Tighten `apps/api/src/modules/documents/recipes/dfd-template.md` guidance for context, object, and justification sections to normally use one or two paragraphs.
- [x] 2.2 Remove or soften wording that encourages conclusions of economicity, vantajosidade, market compatibility, legal sufficiency, or strategic analysis.
- [x] 2.3 Update the essential requirements section to require three to six short, objective, minimum bullets tied directly to the object.
- [x] 2.4 Add prohibitions against detailed execution clauses, fiscalization criteria, payment criteria, SLA, sanctions, and unsupported technical specificity in DFD requirements.

## 3. Prompt Assembly Safeguards

- [x] 3.1 Review DFD prompt assembly in `apps/api/src/modules/documents/documents.shared.ts` and add final role-separation rules if the shared prompt can still pull the DFD toward ETP/TR behavior.
- [x] 3.2 Ensure missing value, execution, budget, market, and supplier data are handled with short conservative wording instead of detailed methodology or invented facts.

## 4. Tests

- [x] 4.1 Update focused DFD recipe or prompt tests to assert that DFD output remains shorter, direct, and administrative.
- [x] 4.2 Add coverage preventing DFD prompts from asking for market methodology, alternatives, sophisticated risks, fiscalization, obligations, payment, measurement, SLA, or sanctions.
- [x] 4.3 Cover representative scenarios: artistic presentation in municipal event, HR advisory service, office supplies acquisition, equipment acquisition, technology service, and work or reform.
- [x] 4.4 Verify conservative handling of absent value, date, duration, supplier, exclusivity, budget, research, and legal-basis data.

## 5. Validation

- [x] 5.1 Run `openspec validate right-size-dfd-generation-role --strict`.
- [x] 5.2 Run focused backend tests for document recipe or prompt assembly changes.
- [x] 5.3 Run API typecheck or the closest existing validation command if prompt-related TypeScript files are changed.
