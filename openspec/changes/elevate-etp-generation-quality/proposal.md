## Why

The current ETP generator has a sound structure and safety guardrails, but its output can still read like a filled checklist or a cautious AI response rather than a technical administrative document prepared by a public procurement team. LicitaDoc needs the ETP recipe to produce more fluent, robust, institutionally consistent, and planning-oriented documents aligned with Law 14.133/2021 planning expectations and TCU good-practice guidance, without inventing facts or turning missing data into false certainty.

## What Changes

- Refactor the `etp` recipe to prioritize continuous institutional prose, developed administrative reasoning, and logical transitions between sections.
- Expand the canonical ETP structure with dedicated sections for `RISCOS DA CONTRATAÇÃO` and `BENEFÍCIOS ESPERADOS`, while preserving existing required estimate, budget, impacts, management/fiscalization, conclusion, and closing sections.
- Strengthen section-level guidance for introduction, need, solution/requisitos, market methodology, alternatives, chosen-solution justification, estimate methodology, budget adequacy, sustainability/impacts, management/fiscalization, risks, benefits, and conclusion.
- Replace repetitive missing-data wording such as "não consta no contexto" and "não informado" with more natural institutional phrasing, while still prohibiting invented values, market research, budgets, quantities, dates, duration, location, technical credentials, or unsupported contractor attributes.
- Add guidance for ETPs to reference public-procurement planning principles and Law 14.133/2021/TCU good practices at a high level, without creating unsupported legal conclusions or excessive citations.
- Improve prompt/context consistency checks so the model is reminded to preserve the process object, municipality, organization, department, item, and inferred profile, and not mix data from other document types or examples.
- Add tests to verify the elevated ETP structure, anti-checklist writing guidance, natural missing-data phrasing, new risk/benefit sections, and context-consistency guardrails.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `etp` recipe must generate fluent, technically robust, institutionally written, context-faithful ETPs with dedicated risks and expected-benefits analysis, without simulating unavailable facts.

## Impact

- Affects ETP recipe assets in `apps/api/src/modules/documents/recipes`.
- Affects ETP prompt assembly in `apps/api/src/modules/documents/documents.shared.ts`.
- Affects document generation tests in `apps/api/src/modules/documents`.
- Does not change public API shapes, database schema, document lifecycle, generation provider selection, frontend behavior, or existing stored documents.
