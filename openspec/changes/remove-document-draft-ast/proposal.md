## Why

Document generation now produces validated Tiptap JSON directly, which is the same structure consumed by the editor and preview. Persisting a separate LicitaDoc AST (`draft_content_ast`) adds a redundant source of truth and keeps legacy conversion code alive without providing value for new documents.

## What Changes

- Remove `draft_content_ast` / `draftContentAst` from the active document persistence model.
- Treat `draftContentJson` as the canonical structured draft for generated and edited documents.
- Keep `draftContent` as compatibility text derived from the JSON draft.
- Remove the legacy structured-document AST generation/fallback path for new reads and writes.
- Add a migration to drop the `documents.draft_content_ast` column once code no longer references it.
- Update tests and fixtures that still expect AST persistence or projection.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: Generated documents must persist and read structured draft content through `draftContentJson`, without depending on `draftContentAst`.

## Impact

- API schema and Drizzle document table definitions.
- Document generation pipeline and worker persistence.
- Document detail serialization and legacy projection helpers.
- Structured output tests/fixtures that currently validate the removed AST envelope.
- Database migration history and generated migration metadata.
- Existing documents that only have `draftContentAst` should be handled before dropping the column, either by migrating them to `draftContentJson` or accepting that this local transitional data is discarded.
