## Why

The current DFD generator is formally correct, but it can become too analytical and too close to an ETP or TR. The DFD needs a clearer document identity: an initial, objective, administrative formalization of demand that records the need, object, initial justification, and essential minimum requirements without entering viability analysis, market methodology, risk studies, or execution clauses.

## What Changes

- Refine the DFD editorial recipe so it explicitly treats the DFD as an initial demand-formalization document, not an ETP, TR, legal opinion, or feasibility study.
- Adjust DFD guidance to keep narrative sections proportional: usually 1-2 paragraphs for context/need, object, and justification.
- Keep essential requirements as 3-6 short, objective bullets tied directly to the object.
- Strengthen prohibitions against ETP/TR-style content such as market research methodology, alternatives, sophisticated risks, fiscalization, obligations, payment/measurement criteria, SLA, economicity conclusions, legal opinions, and detailed execution clauses.
- Simplify and right-size category guidance so DFDs remain object-aware without becoming strategic, technical, or operational studies.
- Preserve existing anti-hallucination rules for values, dates, duration, supplier attributes, exclusivity, market compatibility, budget data, and legal grounds.
- Add tests covering DFD role separation and representative scenarios such as artistic presentation, HR advisory, office supplies, equipment acquisition, technology service, and works/reform.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: the `dfd` recipe must generate concise, objective, administrative, initial demand-formalization documents that remain clearly distinct from ETP, TR, minuta, legal opinions, and feasibility studies.

## Impact

- Affects DFD recipe assets in `apps/api/src/modules/documents/recipes`.
- May affect DFD prompt assembly tests in `apps/api/src/modules/documents`.
- Does not change public APIs, document lifecycle, database schema, generation provider configuration, frontend behavior, or existing stored documents.
