## Context

The ETP generator already has repository-managed recipe assets, an inferred analysis profile, conservative estimate handling, and tests that prevent simulated price research. That base is useful, but the current ETP still risks sounding like a structured prompt response: many sections are framed as bullets to cover, missing-data language can become repetitive, and the template does not yet force dedicated treatment of risks and expected benefits.

The requested improvement is qualitative rather than merely longer output. The generated ETP must read as a technical administrative study prepared during the planning phase of a public procurement process. It should be compatible with Law 14.133/2021 planning practices and TCU-oriented diligence, while avoiding unsupported legal conclusions, invented market research, fictional estimates, or details not present in the process context.

## Goals / Non-Goals

**Goals:**

- Refactor ETP recipe assets so output favors continuous institutional prose over checklist-like responses.
- Add dedicated ETP sections for risks and expected benefits.
- Deepen section-specific guidance for solution execution, market methodology, alternatives, estimate methodology, budget adequacy, sustainability/impacts, fiscalization, conclusion, and context consistency.
- Improve missing-data phrasing so documents remain technically rich without repeating "não informado" or "não consta no contexto".
- Keep strict factual guardrails for values, research, budgets, quantities, dates, duration, contractor attributes, location, legal claims, and technical credentials.
- Add tests around ETP structure, writing style guidance, context-faithfulness, and anti-invention behavior.

**Non-Goals:**

- Do not add external legal or TCU content retrieval at generation time.
- Do not make the model cite law articles or TCU decisions unless those references are explicitly part of the recipe guidance and safe to state generically.
- Do not create per-category ETP templates or a separate prompt route for artistic events.
- Do not alter document APIs, persistence, streaming, provider selection, frontend preview behavior, or database schema.
- Do not guarantee that a non-deterministic language model will always produce perfect legal reasoning; the change improves prompt/recipe contract and tests.

## Decisions

### Decision: Make the template section model more narrative, not more mechanical

The `etp.template.md` should evolve from "describe these bullets" toward "produce institutional paragraphs covering these dimensions." Bullets may remain inside the template as authoring guidance, but the instructions must tell the model not to reproduce them as a dry checklist unless a list is genuinely useful.

Alternatives considered:

- Convert every section to a long exemplar paragraph.
  Rejected because examples can leak wording and make unrelated ETPs sound copied.
- Keep the current template and only extend instructions.
  Rejected because the required new sections and section order need to be visible in the canonical model.

### Decision: Add risks and expected benefits as first-class sections

The canonical ETP should gain:

- `## 9. RISCOS DA CONTRATAÇÃO E MEDIDAS MITIGATÓRIAS`
- `## 10. BENEFÍCIOS ESPERADOS`

Then conclusion and closing move to later numbers. This makes risk management and public-value analysis explicit rather than hidden inside fiscalization or conclusion.

Alternatives considered:

- Keep risks inside management/fiscalization.
  Rejected because the user specifically requested a new risk section and because risk analysis improves ETP technical maturity.
- Keep benefits only inside need and conclusion.
  Rejected because expected benefits deserve a dedicated synthesis tied to interest public, culture/social/economic outcomes, and institutional planning.

### Decision: Strengthen missing-data language through a controlled phrase bank

The recipe should explicitly prefer institutional missing-data phrasing such as "será objeto de apuração complementar", "dependerá de levantamento específico", "a definição ocorrerá em etapa posterior", and "deverá ser verificado pela Administração". These phrases keep the document natural while preserving factual restraint.

The same guidance should forbid repeatedly using "não informado" or "não consta no contexto" as the default sentence shape.

### Decision: Treat Law 14.133/2021 and TCU guidance as planning orientation

The recipe should steer the ETP toward planning-phase concepts: need definition, solution analysis, market/price methodology, risk treatment, lifecycle/execution concerns, fiscalization, budget compatibility, and public-value justification. It should not invent specific article numbers, acórdãos, or legal conclusions.

This gives the document a procurement-planning posture while avoiding brittle or misleading legal citations.

### Decision: Add context consistency reminders in final prompt rules

Prompt assembly should include final rules that explicitly require the model to preserve object, municipality, organization, department, item description, estimate state, and inferred profile. This addresses the risk of mixing data from examples, DFD/TR/minuta recipes, or previous generation context.

### Decision: Test the contract, not ideal prose

Automated tests should verify:

- the new sections are present in the canonical template
- recipe instructions prohibit checklist-like output and repetitive missing-data wording
- final prompt rules include context-consistency constraints
- missing or zero estimates remain unavailable while still requesting rich methodology
- generated content sanitization still preserves required estimate section behavior after renumbering

## Risks / Trade-offs

- [Risk] Longer recipe guidance can increase prompt size. -> Mitigation: keep section instructions compact, avoid long examples, and reuse existing analysis profile context.
- [Risk] Stronger legal/planning language can tempt the model into legal overclaiming. -> Mitigation: explicitly prohibit unsupported article/acórdão citations and require generic planning-oriented phrasing.
- [Risk] New section numbering can break tests or downstream assumptions. -> Mitigation: update tests to assert headings semantically and preserve estimate-section fallback behavior.
- [Risk] More fluid prose guidance may reduce scannability. -> Mitigation: allow limited bullets only where administratively appropriate, such as risks, measures, or fiscalization records.
- [Risk] The model may still repeat missing-data phrases. -> Mitigation: provide preferred alternatives and test for the prompt contract.

## Migration Plan

1. Update `etp.instructions.md` with narrative-quality, legal/planning, missing-data, context-consistency, and section-specific guidance.
2. Update `etp.template.md` to include dedicated risks and expected-benefits sections and to encourage paragraph-based institutional writing.
3. Update ETP prompt assembly final rules with context consistency and anti-template/anti-checklist instructions.
4. Update focused tests for recipe assets, prompt assembly, and sanitized ETP fallback behavior after section renumbering.
5. Run OpenSpec validation, focused document generation tests, and API typecheck.
6. Rollback by restoring the prior ETP recipe assets and prompt rules; no data migration is required.

## Open Questions

- Should future work add optional structured context fields for completed price research, event location, event date, technical rider, fiscal roles, or risk classifications?
- Should the preview/export layer eventually support section-specific formatting guidance so the ETP can be visually more institutional without relying only on Markdown headings?
