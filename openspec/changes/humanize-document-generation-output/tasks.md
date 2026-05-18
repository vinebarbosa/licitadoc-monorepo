## 1. Current Surface Audit

- [x] 1.1 Inspect current recipe loading, prompt assembly, document-generation pipeline, reviewer, rewriter, debug trace, and OpenAPI exposure points.
- [x] 1.2 Inventory duplicated global writer rules across DFD, ETP, TR, and Minuta instructions.
- [x] 1.3 Inventory AI-facing behavior text inside templates, including meta-language, absence explanations, anti-alucination prose, and conditional safety phrasing.
- [x] 1.4 Confirm `sd-document-intelligence`, `references/inference-rubric.md`, `references/context-package.md`, semantic classification, and document planning remain outside the refactor scope.

## 2. Shared Writer Instructions and Recipe Split

- [x] 2.1 Add `apps/api/src/modules/documents/recipes/base-writer.instructions.md` with global factuality, zero-value, placeholder, absence-handling, anti-alucination, institutional tone, and invisible-intelligence rules.
- [x] 2.2 Update `document-generation-recipes.ts` and prompt assembly so every document type receives the shared base writer instructions plus its own concise instruction asset.
- [x] 2.3 Refactor DFD instructions to focus only on initial demand formalization, concise administrative tone, depth boundaries, and what not to turn the DFD into.
- [x] 2.4 Refactor ETP instructions to focus only on proportional analysis, alternatives, risks, estimates, sustainability, fiscalization, and document-role boundaries.
- [x] 2.5 Refactor TR instructions to focus only on operational execution, specifications, receiving, obligations, fiscalization, payment, sanctions, and document-role boundaries.
- [x] 2.6 Refactor Minuta instructions to focus only on dry contractual drafting, clauses, placeholders, fixed clauses, signature handling, and document-role boundaries.

## 3. Render-Only Templates

- [x] 3.1 Clean `dfd-template.md` so it contains structure, headings, placeholders, and layout only.
- [x] 3.2 Clean `etp.template.md` so it contains structure, headings, placeholders, and layout only.
- [x] 3.3 Clean `tr.template.md` so it contains operational section order, headings, placeholders, and layout only.
- [x] 3.4 Clean `minuta.template.md` so it preserves contractual clause order, fixed-clause markers, placeholders, signature slots, and layout only.
- [x] 3.5 Add recipe tests proving templates do not contain writer-facing behavior rules such as "na ausencia", "quando houver", "nao invente", "quando suportado", "o contexto nao apresenta", or similar safety prose.
- [x] 3.6 Add recipe tests proving required headings, placeholders, fixed clauses, and signature structures remain intact after cleanup.

## 4. Writer Style and Section Depth

- [x] 4.1 Add `WriterStyle` schema/type with `dry_legal`, `administrative`, `technical`, `operational`, and `institutional`.
- [x] 4.2 Implement writer-style derivation from document type and enriched classification without replacing the existing document plan.
- [x] 4.3 Pass writer style to Writer, Humanization Pass, Reviewer, Rewriter, and debug trace when pipeline state is available.
- [x] 4.4 Add section-depth variance guidance so sections can be naturally short, dense, or robust according to document type, writer style, classification, and plan.
- [x] 4.5 Add tests for Minuta `dry_legal`, TR `operational`, DFD `administrative`, technical-service ETP `technical`, and social/institutional ETP `institutional` or `administrative`.

## 5. Humanization Pass

- [x] 5.1 Implement a Humanization Pass after Writer and before Reviewer that receives the writer draft, enriched context, document plan, document type, writer style, and specific instructions.
- [x] 5.2 Ensure the pass removes meta-language, visible caution, over-explanation, excessive repetition, and mechanical section symmetry without adding facts or changing values.
- [x] 5.3 Preserve placeholders, zero-value safety, required headings, Minuta fixed clauses, document role, and item coverage during humanization.
- [x] 5.4 Make the pass enabled by default but fallback-safe when pipeline state or provider execution is unavailable.
- [x] 5.5 Extend debug trace to include writer draft, humanized draft or skipped status, reviewer result, rewrite attempts, and final draft only when debug is requested.

## 6. Reviewer and Targeted Rewrite

- [x] 6.1 Extend `DocumentReviewResult` issue taxonomy with `meta_language` and `excessive_defensiveness`.
- [x] 6.2 Add reviewer detection for visible AI phrases and caution patterns such as "na ausencia de", "nao constam informacoes", "quando informado", "quando suportado", "o contexto nao apresenta", "nao foi identificado", "caso existente", and "devera ser confirmado".
- [x] 6.3 Make reviewer instructions request simplification, placeholders, dry contractual wording, or natural omission instead of explanatory caution.
- [x] 6.4 Ensure existing wrong-document-role, generic-text, repetition, zero-value, placeholder, signature, risks, and alternatives checks continue to run.
- [x] 6.5 Update targeted rewrite prompt assembly so review issues from the humanized draft are applied without restarting from scratch or exceeding the existing two-cycle cap.

## 7. Quality and Regression Tests

- [x] 7.1 Add unit tests for meta-language detection and excessive-defensiveness review issues.
- [x] 7.2 Add unit tests proving zero values are still treated as absent estimates after writer-style and humanization changes.
- [x] 7.3 Add provider-stub pipeline tests proving the reviewer evaluates the humanized draft, not the unrefined writer draft.
- [x] 7.4 Add provider-stub pipeline tests proving humanization does not invent values, suppliers, dates, budget data, legal paths, or operational details.
- [x] 7.5 Add integration tests for at least three distinct SD profiles: recurring RH advisory ETP, social/institutional kit distribution, and cultural/artistic presentation.
- [x] 7.6 Add regression coverage proving simple acquisitions do not become artificially long and DFD, ETP, TR, and Minuta keep their document roles.
- [x] 7.7 Add snapshot or phrase-denylist checks proving final documents avoid visible pipeline language while preserving legal and administrative safety.

## 8. Contract, Documentation, and Validation

- [x] 8.1 Update OpenAPI schemas only if debug metadata or public DTOs change; preserve current public generation request compatibility.
- [x] 8.2 Regenerate generated API client artifacts only if OpenAPI output changes.
- [x] 8.3 Update the document-generation README with the revised Writer, Humanization Pass, Reviewer, recipe-responsibility split, writer styles, and debug behavior.
- [x] 8.4 Run focused document-generation recipe tests and pipeline tests.
- [x] 8.5 Run API typecheck or the narrowest available type validation.
- [x] 8.6 Run OpenSpec validation for `humanize-document-generation-output`.
