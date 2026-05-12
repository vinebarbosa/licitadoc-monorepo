## Context

The backend already resolves repository-managed generation recipes for `dfd`, including a textual instruction asset and a Markdown template asset. That foundation is correct, but the current DFD recipe is intentionally minimal: it enforces the canonical structure and safety rules, yet gives little guidance for producing a document with strong administrative substance across different subjects.

The approved Carnaval DFD is useful as a quality benchmark because it demonstrates depth, specificity, public-interest reasoning, and object-specific requirements. It must not become a thematic template. The improved recipe should preserve the same level of diligence for unrelated subjects such as administrative services, goods, works, technology, health, education, maintenance, consulting, and event services.

## Goals / Non-Goals

**Goals:**

- Keep the existing canonical DFD structure: solicitation data, demand context, contracting object, justification, essential requirements, and closing/signature block.
- Improve the DFD recipe so it produces specific, review-ready, subject-aware text for any process object.
- Make the recipe select requirement language according to the nature of the object, using only facts available in process context.
- Prevent unsupported claims about legal grounds, values, market compatibility, execution duration, locations, quantities, or technical capabilities.
- Prefer canonical names and clean Markdown output suitable for document preview/export.
- Add coverage across multiple object categories so quality does not regress toward a single example subject.

**Non-Goals:**

- Do not create a separate DFD recipe per subject.
- Do not change public document APIs, document lifecycle, SSE streaming, database schema, or provider configuration.
- Do not make the DFD generate ETP, TR, minuta, detailed market research, or procurement clauses.
- Do not make the model invent missing facts in order to make the document appear more complete.

## Decisions

### Decision: Keep one universal DFD recipe with object-aware guidance

The recipe should remain one universal `dfd` recipe. It should instruct the model to infer the broad nature of the object from the provided context and adapt the narrative and requirements accordingly.

Examples of adaptation:

- Cultural/event service: artistic relevance, event compatibility, schedule, audience, public access, safety, technical structure when provided.
- Administrative service: specialized expertise, continuity, confidentiality, compliance, operational support.
- Goods acquisition: quantity, specification, delivery, warranty, suitability, replacement or stock need.
- Works/engineering: location, technical responsibility, safety, execution constraints, public facility impact.
- Technology: availability, support, security, integration, data protection, continuity.
- Health/education: public served, continuity, technical adequacy, service impact, compliance.

This avoids creating a brittle set of templates while still giving the model a practical editorial map.

Alternatives considered:

- Create multiple DFD recipes by category.
  Rejected because category selection would add routing complexity and increase maintenance while still leaving edge cases.
- Use the Carnaval DFD as a direct expanded template.
  Rejected because it would bias unrelated DFDs toward event/culture language.

### Decision: Treat the approved reference as quality calibration, not content source

The reference DFD should guide the expected density of reasoning, but not provide reusable facts or theme-specific language. The recipe should describe the desired qualities explicitly: concrete context, clear need, specific object, public-interest justification, impact of non-attendance, and object-compatible requirements.

Alternatives considered:

- Include long examples from the reference in the runtime prompt.
  Rejected because examples can leak wording and theme into unrelated generations.
- Keep the current concise recipe.
  Rejected because it allows safe but shallow DFDs and does not consistently produce the target quality level.

### Decision: Strengthen conservative fact handling

The prompt should distinguish between:

- facts that may be stated because they exist in context
- cautious administrative inferences that follow directly from the object
- facts that must not be invented

Value-related language needs special care. If extracted values are absent or `0,00`, the DFD must not say values are compatible with market prices. It may say the estimate or compatibility must be assessed in the appropriate process phase, if that matches available context.

The same applies to duration, dates, quantities, legal grounds, contractor exclusivity, artist recognition, technical credentials, and location.

### Decision: Normalize field presentation for review-ready Markdown

The DFD output should not wrap field values in Markdown inline code ticks. The preview/export surface treats the generated Markdown as a formal document, not a code sample.

Prompt context should prefer canonical department and organization names over abbreviations when both are available. Extracted source abbreviations may still be used as fallbacks, but the generated DFD should present the clearest official label available.

### Decision: Test with categories, not just snapshots

Tests should verify recipe and prompt behavior across representative categories. The goal is not to assert exact generated prose from the model, but to assert that prompt assets and prompt assembly contain the instructions, context, and guardrails needed for robust DFD generation.

Suggested cases:

- Cultural event service with absent or zero value.
- Administrative consulting/service.
- Goods acquisition with quantity and delivery-oriented requirements.
- Technology or maintenance service requiring continuity/security/support language.
- Missing optional data, verifying no unsupported facts are encouraged.

## Risks / Trade-offs

- [Risk] More guidance can make the prompt longer and slower. -> Mitigation: keep category guidance compact and reusable, not example-heavy.
- [Risk] Object-aware guidance can still overfit to listed examples. -> Mitigation: phrase categories as examples and require adaptation to actual context.
- [Risk] Conservative value handling may produce visible absence statements. -> Mitigation: prefer concise reviewable language over invented certainty.
- [Risk] Tests may become too brittle if they assert generated prose. -> Mitigation: test recipe/prompt contract and sanitization, not exact provider output.

## Migration Plan

1. Update the `dfd` instruction and template assets to express universal, object-aware quality rules.
2. Enrich DFD prompt context with reliable extracted item details, values, quantities, source labels, canonical department names, and responsible role fallbacks where already available in stored process metadata.
3. Adjust sanitization or tests if needed so formal DFD Markdown avoids inline code ticks around field values.
4. Add focused tests for prompt assembly and recipe content across multiple DFD object categories.
5. Rollback by restoring the previous DFD recipe assets and prompt context behavior; no data migration is required.

## Open Questions

- Should the generated DFD preserve accents exactly as produced by the model, or should the backend apply a normalization policy per export format later?
- Should responsible role gender agreement be inferred from names, or should it remain strictly sourced from structured/canonical department metadata?
