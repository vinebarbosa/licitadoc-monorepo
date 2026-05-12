## Context

The backend already resolves repository-managed recipes for ETP generation: an instruction asset, a Markdown template asset, and prompt assembly that passes process, organization, department, source, item, and estimate context to the text generation provider. This foundation is correct and should remain intact.

The reviewed ETP reference demonstrates useful quality signals: a stronger introduction, clearer need analysis, explicit risk of non-contracting, solution requirements, alternative scenarios, market/price methodology, budget compatibility, impact analysis, fiscalization duties, and a reasoned recommendation. It also contains details that must not become generic system behavior, such as asserting that market research was performed, stating duration, location, technical structure, or artist recognition when the process context does not support those facts.

## Goals / Non-Goals

**Goals:**

- Improve the ETP recipe so generated ETPs are more complete, technical, organized, and suitable for public procurement review.
- Preserve the canonical ETP flow: introduction, need, solution requirements, market/alternatives, estimate, budget, impacts, management/fiscalization, conclusion, and closing block.
- Make ETP analysis subject-aware without creating separate templates for each object category.
- Keep strict handling of missing estimate, absent market research, budget data, legal claims, contractor attributes, dates, quantities, duration, and locations.
- Add tests that verify the recipe and prompt contract, not exact model prose.

**Non-Goals:**

- Do not change public document APIs, storage, document lifecycle, streaming, provider configuration, or frontend behavior.
- Do not hardcode the Carnaval/FORRO TSUNAMI reference or any other specific example into generated ETP content.
- Do not make the ETP produce DFD, TR, minuta, edital clauses, or complete price research unsupported by process data.
- Do not introduce new dependencies or database migrations.

## Decisions

### Decision: Keep one universal ETP recipe with analysis-profile guidance

The ETP recipe should remain a single universal recipe. Prompt assembly should expose an inferred analysis profile from existing process context, using broad categories such as artistic presentation, general event, goods, equipment rental, works/engineering, technology, health/education, or general services.

The profile is editorial guidance only. It helps the model choose emphasis, such as cultural impact for artistic services or delivery/warranty concerns for goods, while the factual source of truth remains the supplied context.

Alternatives considered:

- Create one ETP template per category.
  Rejected because it would add routing complexity and make edge cases harder to maintain.
- Use the model ETP as a direct expanded template.
  Rejected because it would leak specific event language into unrelated documents.

### Decision: Strengthen the template with expected content, not fixed facts

The Markdown template should keep the canonical section structure but make the expected contents more explicit. Sections should require analysis of risks, methodology, alternatives, and fiscalization responsibilities, while phrasing each item as guidance rather than a prewritten factual statement.

This lets the model produce more complete text without being encouraged to claim that a price survey, prior-contract search, or supplier quote already occurred.

### Decision: Treat missing research and estimates conservatively

The recipe should distinguish between:

- stated facts available in context
- administrative reasoning that follows directly from the object
- missing facts that must be recorded conservatively

If no value or market research is available, the ETP may describe a future methodology for price research, but it must not claim research was performed or imply market validation already exists.

### Decision: Validate prompt contracts instead of generated wording

Tests should assert that the ETP prompt includes the improved instructions, canonical sections, analysis profile, estimate safety, and anti-invention guardrails. Provider output remains non-deterministic, so tests should avoid snapshotting ideal prose.

## Risks / Trade-offs

- [Risk] More editorial guidance increases prompt length. -> Mitigation: keep category and section guidance compact and reusable.
- [Risk] Subject-aware guidance can overfit to listed examples. -> Mitigation: require adaptation to the actual process context and explicitly forbid copying irrelevant category examples.
- [Risk] Conservative missing-data language may produce visible absence statements. -> Mitigation: prioritize reviewable truth over invented completeness and phrase absence in professional administrative language.
- [Risk] A model may still invent market research when asked for a richer ETP. -> Mitigation: repeat market/estimate constraints in both recipe instructions and final prompt rules, and cover them in tests.

## Migration Plan

1. Update ETP instruction and template assets.
2. Add an inferred ETP analysis profile to backend prompt assembly using existing context fields.
3. Add focused prompt/recipe tests for artistic-service ETPs and missing estimate/market research behavior.
4. Validate the OpenSpec change and run backend document-generation tests.
5. Roll back by restoring the prior recipe assets and removing the prompt profile line; no data migration is required.

## Open Questions

- Should future intake parsing extract explicit market research artifacts from uploaded PDFs so the ETP can distinguish completed research from planned methodology?
- Should the system later render different official signature roles by document type, or continue using the existing responsible-role fallback shared by generated documents?
