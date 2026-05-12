## Context

The document-generation pipeline builds provider prompts from repository-managed recipe assets, structured process context, operator instructions, and backend final rules. The current recipe assets and many prompt labels were intentionally written in ASCII, while some extracted or model-generated values still contain accents. That produces mixed drafts such as accented object descriptions inside unaccented headings and administrative labels.

The backend also uses accent-insensitive normalization for matching and sanitization. That behavior is useful for comparing headings and parsing source documents, but it should remain an internal search strategy rather than a source of document-facing text.

## Goals / Non-Goals

**Goals:**

- Make document-facing recipe instructions, templates, prompt labels, final rules, and fallback snippets use correct Brazilian Portuguese accents.
- Keep internal accent-insensitive matching where it helps robustly detect headings, labels, and sections.
- Preserve existing generated document structures, anti-hallucination guardrails, and provider behavior.
- Add tests that catch future unaccented Portuguese in formal document-facing generation text.

**Non-Goals:**

- Do not add automatic accent restoration over arbitrary model output.
- Do not change public API contracts, document lifecycle, SSE streaming, database schema, or provider selection.
- Do not alter user-entered or source-extracted values merely because they lack accents.
- Do not translate internal identifiers, enum values, error codes, slugs, or test-only fixture values that are not formal document text.

## Decisions

### Decision: Correct prompt sources instead of post-processing model output

The primary fix should update the text that primes generation: recipe assets, prompt section labels, final rules, and backend fallback sections. These are deterministic sources of unaccented text and the safest place to improve quality.

Alternatives considered:

- Add a post-generation accent-repair pass. Rejected because it could corrupt names, acronyms, source values, legal references, or intentionally unaccented user input.
- Rely on the model to infer accents despite unaccented prompt text. Rejected because the current behavior shows the prompt strongly influences output style.

### Decision: Keep accent-insensitive normalization for comparisons only

Functions that remove diacritics for search, heading detection, parser matching, department matching, or sanitization should continue doing so. The implementation should avoid returning normalized comparison strings as document text.

Alternatives considered:

- Remove accent-insensitive comparison entirely. Rejected because generated provider output may vary between accented and unaccented headings, and robust sanitization depends on tolerant matching.
- Maintain duplicate accented and unaccented regex branches everywhere. Rejected because the existing normalization helpers already solve this cleanly.

### Decision: Scope the correction to formal generation text

The change should focus on `dfd`, `etp`, `tr`, and `minuta` recipe assets and prompt assembly. Internal code names, stable test IDs, slugs, enum values, JSON metadata keys, error codes, provider metadata, and source values should remain untouched unless they are directly rendered as formal document prose.

Alternatives considered:

- Sweep the entire repository for unaccented Portuguese. Rejected because many strings are intentionally machine-oriented or outside generated-document quality.
- Change only DFD assets. Rejected because ETP, TR, and minuta share the same prompt pattern and have the same visible quality issue.

### Decision: Test deterministic inputs, not provider prose

Regression tests should assert the prompt, recipe assets, and sanitizer fallbacks contain accented formal Portuguese. They should not require exact provider prose, because live model output remains nondeterministic.

Alternatives considered:

- Add provider snapshot tests. Rejected because they would be brittle and dependent on model behavior.
- Test only final stored content. Rejected because unaccented text can enter through multiple prompt sources before provider generation.

## Risks / Trade-offs

- [Risk] Some existing tests assert unaccented prompt snippets. -> Mitigation: update those assertions alongside the intended text changes.
- [Risk] Accented recipe text can make accent-insensitive sanitization appear redundant. -> Mitigation: keep current comparison normalization and add coverage that accented and unaccented headings are still recognized where relevant.
- [Risk] Source PDFs or user-entered fields may still contain unaccented values. -> Mitigation: preserve source fidelity and avoid guessing accents for user/source data.
- [Risk] A model can still emit unaccented text despite accented prompts. -> Mitigation: remove deterministic unaccented priming first; consider a later quality-control pass only if evidence remains.

## Migration Plan

1. Update recipe asset Markdown files for `dfd`, `etp`, `tr`, and `minuta` with accented Portuguese in formal document-facing text.
2. Update `documents.shared.ts` prompt assembly strings and sanitizer fallback snippets to use accented Portuguese while preserving internal normalization helpers.
3. Update focused recipe/prompt/sanitization tests.
4. Run focused API document-generation tests, then the broader API document test target if the focused suite passes.
5. Rollback by reverting recipe text and prompt/fallback string changes; no data migration is required.

## Open Questions

- Should a later change add a lint-like test that scans only known recipe/prompt assets for common unaccented Portuguese terms?
- Should historical drafts already stored without accents be left unchanged, or should there eventually be a manual regeneration/revision path?
