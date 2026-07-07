## 1. Schema and Migration

- [x] 1.1 Inspect migration status for `0018_document_draft_content_ast.sql` and decide whether to delete the pending AST migration or add a forward drop-column migration.
- [x] 1.2 Remove `draftContentAst` from the Drizzle `documents` schema and inferred stored document types.
- [x] 1.3 Update database migration metadata to match the chosen AST-column removal strategy.
- [x] 1.4 If needed, add a safe migration step that preserves usable `draftContentJson` or `draftContent` before dropping `draft_content_ast`.

## 2. Document Generation and Reads

- [x] 2.1 Remove worker persistence of `draftContentAst` from successful generation updates.
- [x] 2.2 Remove AST-based projection from document detail serialization so reads prefer `draftContentJson` and then text fallback.
- [x] 2.3 Remove or retire the legacy structured-document AST generation path from the pipeline if it is no longer reachable after direct Tiptap JSON generation.
- [x] 2.4 Keep direct Tiptap JSON generation, validation, text derivation, and response metadata intact.

## 3. Code Cleanup

- [x] 3.1 Remove unused AST-specific imports, types, fixtures, helpers, and tests that only support `draftContentAst`.
- [x] 3.2 Keep shared provider structured-output support required for Tiptap JSON output.
- [x] 3.3 Update document/process fixtures that still include `draftContentAst`.
- [x] 3.4 Update API response tests to assert `draftContentJson` behavior without AST fallback.

## 4. Verification

- [x] 4.1 Add or update tests proving generated documents persist `draftContentJson` and do not write AST data.
- [x] 4.2 Add or update tests proving document detail reads from `draftContentJson` and still supports text-only legacy fallback.
- [x] 4.3 Run relevant API document generation, document read/update, process fixture, and structured JSON tests.
- [x] 4.4 Run migration generation/checks needed by the repo.
- [x] 4.5 Run API typecheck and targeted static checks for touched files.
- [x] 4.6 Run `openspec validate remove-document-draft-ast --strict`.
