# Document Generation Pipeline

Document generation is orchestrated as a small pipeline instead of asking each recipe to do every
job. For SD-backed processes, the runtime contract derived from
`.codex/skills/sd-document-intelligence/SKILL.md` is the authoritative behavior source.

Flow:

1. Runtime `sd-document-intelligence` contract is loaded and validated.
2. Extractor reads only literal process/SD evidence.
3. Context enrichment classifies the object before making inferences.
4. Document planning adapts depth and focus to DFD, ETP, TR, or Minuta.
5. Writer style is derived from document type and classification (`dry_legal`, `administrative`, `technical`, `operational`, or `institutional`).
6. Writer receives the skill contract, enriched context, plan, shared base writer rules, concise document instructions, render-only template, style, and operator notes.
7. Humanization Pass refines the writer draft while preserving the skill contract, facts, placeholders, values, and document role.
8. Reviewer evaluates the humanized draft against the skill contract, enriched context, plan, and requested document type.
9. Rewriter applies targeted changes, with at most two automatic cycles.

The runtime contract is stored as `recipes/sd-document-intelligence.contract.md` and must mirror the
Codex skill source. Drift tests compare the contract digest with the skill digest; if the skill
changes, the runtime contract must be synchronized intentionally. Generation is fail-closed when a
strict pipeline run cannot load, parse, or validate the contract instead of falling back to a generic
prompt.

The public create-document route remains compatible. The optional `debug` request flag returns the
skill contract identity, initial extracted facts, enriched context, plan, writer style, writer draft,
humanization result, review results, rewrite attempts, and final draft only in debug metadata.
Default user-facing responses expose the final document, not the internal trace or the skill text.

Recipe responsibility is intentionally narrow:

- `base-writer.instructions.md` contains global safety, factuality, placeholder, zero-value, signature, tone, and invisible-intelligence rules.
- Document-specific instruction files define only role, boundaries, tone, depth, emphasis, and what to avoid.
- Templates are render-only assets: headings, placeholders, clause order, fixed clauses, signature slots, and layout.

Semantic classification, administrative inferences, risks, alternatives, writer-style derivation,
proportional planning, review, humanization, and bounded rewrite live in
`document-generation-pipeline.ts`, its schemas, and the runtime `sd-document-intelligence` contract.
