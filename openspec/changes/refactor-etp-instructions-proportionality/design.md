## Context

The current ETP instruction asset is safe and conservative, but it gives the model too many broad invitations to expand. In practice, simple purchases can become long, abstract ETPs with repeated institutional language and little operational analysis. The refactor should preserve the anti-hallucination and Law 14.133/2021 guardrails while changing the prompt's center of gravity toward proportionality, concrete administrative analysis, and less repetitive prose.

The implementation target is `apps/api/src/modules/documents/recipes/etp.instructions.md`. This change does not need a new prompt assembly contract or API shape; the backend already resolves repository-managed recipe assets.

## Goals / Non-Goals

**Goals:**

- Replace `etp.instructions.md` with a full rewritten version.
- Preserve prohibitions on invented facts, fake research, fake prices, fake legal citations, and unsupported operational details.
- Add explicit proportionality rules by complexity, risk, value, criticality, and operational impact.
- Reduce repetition and "AI institutional" language.
- Make ETPs more operationally concrete for purchases, kits, services, events, technology, works, and equipment rental.
- Improve alternative analysis without requiring unsupported facts.
- Keep the current canonical ETP Markdown template compatible.

**Non-Goals:**

- Change `etp.template.md`.
- Change document type contracts, routes, persistence, streaming, or OpenAPI schemas.
- Remove required ETP sections.
- Make the ETP informal or legally thin.
- Add a new dependency or generation provider behavior.

## Decisions

### Decision: Rewrite the instruction asset as layered modules

The new prompt should be organized into clear modules: mandatory rules, proportionality, objective language, operational concreteness, Law 14.133 safety, estimate handling, missing information, section guidance, object adaptation, SD item usage, consistency, and final checklist.

Alternative considered: lightly patch the existing text. That would keep the accumulated repetition and would not strongly alter model behavior.

### Decision: Treat proportionality as a first-class rule

The prompt should explicitly tell the model that all canonical sections remain present, but section density changes with object complexity. Simple purchases should receive concise treatment; complex or risky objects can receive more developed analysis.

Alternative considered: prescribe page or word counts. That is too brittle because generation context varies and the app does not currently pass formal value/complexity tiers.

### Decision: Shift from institutional abstraction to operational evidence

The prompt should name concrete administrative dimensions: delivery, receiving, storage, kits, checking quantities, controls, logistics, quality, execution evidence, and practical risks. This gives the model a better replacement for vague phrases rather than merely forbidding them.

Alternative considered: only list banned phrases. That reduces some repetition but does not teach the model what useful analysis should replace it.

### Decision: Keep safety and estimate rules explicit

The refactor must preserve the current critical behavior for missing or zero estimates. The prompt should continue treating `0`, `0,00`, `0.00`, and `R$ 0,00` as absence of estimate and must forbid simulated price research.

Alternative considered: move estimate rules to tests only. The rule is too important and must remain visible in the provider prompt.

### Decision: Store the complete proposed file as an OpenSpec artifact

Because the requested output includes the complete final file, this change includes `etp.instructions.proposed.md` as an implementation-ready reference. The apply step should copy this content to the runtime recipe file, then update tests.

Alternative considered: describe the rewrite only in prose. That would leave too much prompt-engineering discretion for apply time.

## Risks / Trade-offs

- [Risk] Shorter simple ETPs may feel less "complete" to some reviewers. -> Mitigation: all canonical sections remain present, but density is proportional and still technical.
- [Risk] Stronger object-specific guidance could tempt the model to infer unsupported logistics. -> Mitigation: every operational module repeats that details must come from context or be framed as future verification.
- [Risk] Tests may only assert phrase presence, not output quality. -> Mitigation: update tests for the new structural rules and add representative phrases for proportionality, repetition control, alternatives, and operational concreteness.
- [Risk] Existing prompt expectations may break due to a full rewrite. -> Mitigation: preserve key semantic anchors already tested: Law 14.133, missing estimate, future price methodology, no invented legal basis, items from SD, and no DFD/TR structure.
