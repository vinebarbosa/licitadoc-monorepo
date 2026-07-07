## Context

The current codebase contains two structured document concepts:

- `draftContentJson`: Tiptap JSON used by the protected editor, preview, save flow, and new direct generation path.
- `draftContentAst`: an older LicitaDoc-owned AST introduced for structured provider output, converted later into Tiptap JSON and text.

The latest `generate-documents-as-tiptap-json` change makes new generated documents request validated Tiptap JSON directly. In that path, the pipeline intentionally returns `structuredOutput: null` and persists `draftContentJson`; `draftContentAst` is no longer written for new documents.

## Goals / Non-Goals

**Goals:**

- Remove `draftContentAst`/`draft_content_ast` from the active application model.
- Make `draftContentJson` the single structured persisted source for generated and edited drafts.
- Preserve `draftContent` as compatibility text derived from Tiptap JSON.
- Remove legacy AST projection/fallback code from document reads.
- Remove or supersede database migration/schema definitions that add the AST column.

**Non-Goals:**

- Changing the editor or preview UI.
- Removing Tiptap JSON validation/generation.
- Backfilling production data beyond a simple safe migration path.
- Reintroducing the legacy LicitaDoc AST as metadata.

## Decisions

### Decision: Treat Tiptap JSON as the canonical structured source

Generated documents should persist `draftContentJson` as the authoritative structured draft. The compatibility `draftContent` text should continue to be stored for search/export/fallback behavior, but it is derived from the JSON output.

Alternative considered: keep `draftContentAst` as a parallel semantic representation. Rejected because it creates two structured sources that can drift and forces read paths to choose precedence.

### Decision: Remove AST reads and writes together

The worker should stop writing `draftContentAst`, the schema should stop exposing it, and document detail serialization should resolve from `draftContentJson` first with text-only fallback. This avoids keeping a half-retired column that still changes read behavior.

Alternative considered: leave the column as nullable but unused. Rejected because it keeps migration/schema churn and can confuse future debugging when rows have mixed structured sources.

### Decision: Handle migration status conservatively

If the AST migration is not part of the committed/released baseline, the implementation should remove the pending migration and metadata that introduced it. If it is already part of the active migration chain, the implementation should add a forward migration that drops `documents.draft_content_ast` after ensuring rows have usable `draft_content_json` or `draft_content`.

Alternative considered: always add a drop-column migration. Rejected because this repo appears to still have local/unarchived migration work, and adding churn on top of an unreleased migration may be noisier than removing the original pending migration.

## Risks / Trade-offs

- [Risk] Legacy local rows that only contain `draftContentAst` could lose their best structured source. -> Mitigation: before dropping the column, derive `draftContentJson`/`draftContent` for any such rows or accept the loss only for disposable local test data.
- [Risk] Tests still import AST fixtures/utilities. -> Mitigation: update tests to use generated Tiptap JSON fixtures for current behavior and keep only utilities still needed by active code.
- [Risk] DOCX/export work might have expected AST semantics later. -> Mitigation: make export consume `draftContentJson`; if a richer semantic model is needed later, introduce it intentionally rather than preserving the retired AST by accident.
- [Risk] Removing AST-specific structured output helpers could accidentally remove generic provider structured-output support. -> Mitigation: remove only the LicitaDoc AST contract, not the provider's generic structured response capability used for Tiptap JSON.

## Migration Plan

1. Inspect whether `0018_document_draft_content_ast.sql` is committed/released or still pending local migration state.
2. Remove the AST column from the Drizzle schema and document row/test fixtures.
3. Remove worker persistence of `draftContentAst` and AST-based document projection.
4. Remove or replace AST-specific helper imports and tests.
5. Adjust migrations using the conservative rule above.
6. Run document generation, document read/update, process fixture, and migration/type/static checks.
