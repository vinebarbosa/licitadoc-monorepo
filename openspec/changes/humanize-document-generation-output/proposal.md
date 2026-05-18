## Why

The document-generation pipeline now has strong semantic intelligence, but the final drafts still expose too much of the system's internal caution. Generated documents read as technically correct yet visibly AI-shaped: defensive phrasing, metalinguistic absence handling, excessive symmetry, and templates that still contain behavioral instructions.

This change preserves the current semantic architecture and focuses on making the final rendered documents feel like natural institutional writing produced by an experienced public servant.

## What Changes

- Add a shared base writer instruction asset for global rules: factuality, zero-value handling, placeholders, anti-hallucination, absence handling, institutional tone, and the rule that pipeline intelligence must remain invisible in final text.
- Refactor DFD, ETP, TR, and Minuta instruction assets so each file only defines document identity, role, tone, depth, emphasis, and boundaries.
- Clean document templates into render-only structural assets: headings, placeholders, clauses, section order, and layout, without AI behavior rules or contextual caution language.
- Add an optional humanization pass after Writer and before Reviewer to reduce meta-language, excessive defensiveness, symmetrical section depth, repetitive safety phrasing, and over-explained institutional prose.
- Extend reviewer behavior to detect visible AI language and cautional metalinguistic phrases through `meta_language` and `excessive_defensiveness` issue types.
- Add configurable writer styles (`dry_legal`, `administrative`, `technical`, `operational`, `institutional`) and map them to document type and enriched classification.
- Add section depth variance rules so generated sections can be naturally short, dense, or minimal where a human document would not overdevelop.
- Keep the skill, inference rubric, context package, semantic classifier, document planning, and multi-stage pipeline intact.

## Capabilities

### New Capabilities
- `document-output-humanization`: Covers final-output naturalization, writer styles, invisible-intelligence rules, section depth variance, and meta-language detection.

### Modified Capabilities
- `document-generation`: Generated document flow gains an optional Humanization Pass and reviewer checks for meta-language/excessive defensiveness while preserving existing generation API behavior.
- `document-generation-recipes`: Recipe assets are rebalanced so shared rules live in a base writer instruction file, document-specific instructions stay concise, and templates become render-only.

## Impact

- Affected backend code: document-generation pipeline orchestration, review result schemas, prompt assembly, tests around review/rewrite and output quality.
- Affected recipe assets: `base-writer.instructions.md`, `dfd-instructions.md`, `etp.instructions.md`, `tr.instructions.md`, `minuta.instructions.md`, and all document templates.
- No public API breaking change is intended.
- No replacement of `sd-document-intelligence`, `references/inference-rubric.md`, `references/context-package.md`, semantic classification, or document planning is intended.
