## Context

The current document-generation system already separates semantic work from document rendering. `sd-document-intelligence`, the inference rubric, the context package, the deterministic enrichment layer, document planning, writer, reviewer, and bounded rewrite stages are the right architectural spine and should remain intact.

The problem is now in the final writing surface. Recipe instructions and templates still contain visible safety language and AI-facing behavior rules. The writer receives correct context but often verbalizes caution directly in the draft, producing phrases such as "na ausência de contexto", "quando houver", "não constam informações", and similar defensive constructions. This makes technically sound documents feel less like natural municipal drafting and more like cautious AI output.

This change is a refinement layer on top of the current architecture, not a replacement of the semantic pipeline.

## Goals / Non-Goals

**Goals:**

- Keep semantic intelligence invisible in the final document while preserving factual safety.
- Move shared writer rules into a single base instruction asset.
- Make document-specific instructions short and role-focused.
- Convert templates into render-only structural assets.
- Add writer styles and section depth variance to reduce symmetrical AI prose.
- Add a Humanization Pass between Writer and Reviewer.
- Extend reviewer quality checks to detect meta-language and excessive defensiveness.
- Preserve existing public API compatibility and current document types.

**Non-Goals:**

- Rewrite or replace `sd-document-intelligence`.
- Rewrite `references/inference-rubric.md` or `references/context-package.md`.
- Replace semantic classification, enrichment, document planning, or the multi-stage pipeline.
- Add legal validation or final procurement approval.
- Add new public endpoints or require callers to manually choose pipeline stages.
- Remove anti-alucination safeguards; the change only stops exposing them as prose.

## Decisions

### Decision: Add a shared base writer instruction asset

Create `base-writer.instructions.md` in the document recipe area and include it in prompt assembly for DFD, ETP, TR, and Minuta. It should contain the global rules now repeated across document-specific instructions: factuality, zero-value handling, placeholders, absence handling, anti-alucination, institutional tone, and invisible-intelligence rules.

Alternative considered: keep repeated rules inside each document instruction. Rejected because repetition makes recipes verbose, harder to tune, and more likely to leak safety language into final prose.

### Decision: Keep document-specific instructions as role definitions

Refactor document-specific instruction files so they cover only identity, role, tone, depth, emphasis, and boundaries. DFD remains initial demand formalization, ETP remains proportional analysis, TR remains operationalization, and Minuta remains contractual formalization.

Alternative considered: merge all instructions into one global file. Rejected because each document type still needs a clear role boundary and style profile.

### Decision: Treat templates as render-only assets

Remove AI-facing behavior from templates. Templates should contain headings, placeholders, clause order, numbering, and structural layout only. They should not include "não invente", "quando houver", "na ausência", "o contexto não apresenta", or similar instructional prose.

Alternative considered: leave some safety instructions inline in templates for local clarity. Rejected because templates are copied into the writer context and their language can bleed into the final document.

### Decision: Add WriterStyle as a planning/output control

Introduce a `WriterStyle` type with `dry_legal`, `administrative`, `technical`, `operational`, and `institutional`. Derive the style from document type and enriched classification:

- Minuta: `dry_legal`
- TR: `operational`
- DFD: `administrative`
- ETP with technical/continuous services: `technical`
- ETP with social/institutional actions: `administrative` or `institutional`
- ETP for simple goods: `administrative`

Alternative considered: rely only on `recommendedTone`. Rejected because tone is descriptive, while writer style should be a stricter rendering control for sentence density, clause dryness, and section depth.

### Decision: Insert Humanization Pass after Writer and before Reviewer

The Humanization Pass should receive the first writer draft, enriched context, document plan, writer style, and document type. It should revise only the text surface: remove meta-language, reduce repeated safety explanations, condense over-complete sections, vary section depth, and naturalize institutional phrasing. It must not add facts, change values, remove required placeholders, or alter document role.

Alternative considered: ask the writer to be more human in the same prompt. Rejected because separating this pass makes the responsibility testable and lets the reviewer inspect the final surface.

### Decision: Keep Humanization Pass optional and bounded

The pass should be enabled by default for document generation but structurally optional so tests and fallback paths can bypass it if provider execution fails or legacy metadata lacks pipeline state. It should run once before reviewer; existing reviewer/rewrite cycles remain bounded separately.

Alternative considered: run humanization after every rewrite. Rejected for initial scope because it can multiply latency and make review loop causality harder to debug.

### Decision: Extend reviewer issue taxonomy

Add reviewer issue types `meta_language` and `excessive_defensiveness`. The reviewer should detect visible AI safety language, metalinguistic absence handling, repeated "context" phrasing, and overly defensive constructions. It should request simplification, placeholder use, dry contractual wording, or omission instead of explanatory caution.

Alternative considered: fold these into `generic_text`. Rejected because the current problem is specific enough to deserve targeted tests and revision instructions.

### Decision: Add section depth variance as an output requirement

The writer/humanization instructions should explicitly allow natural irregularity: short adequacy sections, dry contractual clauses, concise sustainability content, and brief conclusions when the document role supports it. Section depth should be proportional to the enriched plan, not mechanically equal across all headings.

Alternative considered: keep section lengths uniform for completeness. Rejected because uniform density is one of the main signals of AI-generated institutional prose.

### Decision: Preserve debug without exposing humanization by default

Debug trace may include humanization inputs/outputs when debug is requested, but ordinary document responses should still expose only the final document behavior. This preserves troubleshooting without making internal stages visible to end users.

Alternative considered: omit humanization trace entirely. Rejected because regression debugging will need to compare writer draft, humanized draft, reviewer issues, and rewrite results.

## Risks / Trade-offs

- [Risk] Humanization may remove useful legal caution. -> Mitigation: base instructions and reviewer checks must distinguish hidden safety from removed safety; legal safeguards stay in structure, placeholders, and clauses.
- [Risk] Template cleanup may accidentally remove structural placeholders. -> Mitigation: tests should assert required headings/placeholders remain for each document type.
- [Risk] Extra provider pass increases latency and cost. -> Mitigation: run the pass once, keep it optional/fallback-safe, and avoid extra loops.
- [Risk] Meta-language detection may overfit to a phrase list. -> Mitigation: combine exact phrase detection with broader issue assertions and acceptance samples.
- [Risk] Natural section variance could underdevelop genuinely complex sections. -> Mitigation: derive depth from `documentPlan.recommendedDepth`, document type, and writer style.
- [Risk] Recipe refactor could blur document boundaries. -> Mitigation: keep concise document-specific instructions and existing wrong-role reviewer checks.

## Migration Plan

1. Add `base-writer.instructions.md` and update recipe loading/prompt assembly to include it for all document types.
2. Refactor document-specific instructions to role, emphasis, style, and boundaries only.
3. Clean DFD, ETP, TR, and Minuta templates into render-only structures while preserving headings, placeholders, clause order, and layout.
4. Add `WriterStyle` schemas/types and derive style from document type plus enriched classification.
5. Add Humanization Pass to the pipeline between Writer and Reviewer, including debug trace support.
6. Extend reviewer schema and logic with `meta_language` and `excessive_defensiveness`.
7. Add tests for template purity, concise instructions, writer styles, meta-language detection, humanization behavior, zero-value safety, and document-role boundaries.
8. Roll back by disabling Humanization Pass and keeping the previous writer/reviewer path; base/template refactors should remain independently safe if tests pass.

## Open Questions

- Should Humanization Pass run for every document type by default, or should Minuta use a stricter dry-legal variant with less rewriting?
- Should writer style be stored in debug trace only, or also persisted in generation metadata summary?
- How strict should the meta-language phrase detector be for legitimate wording such as "ausência de estimativa" in technical sections?
