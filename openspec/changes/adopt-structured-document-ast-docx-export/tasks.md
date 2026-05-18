## 1. Structured AST Foundation

- [ ] 1.1 Inspect current document generation, editor save, preview, text-adjustment, and document detail serialization paths.
- [ ] 1.2 Define TypeScript types and Zod schemas for the versioned LicitaDoc document AST.
- [ ] 1.3 Add representative AST fixtures for DFD, ETP, TR, Minuta, page breaks, lists, tables, placeholders, and signature blocks.
- [ ] 1.4 Decide whether `draftContentAst` is public response data or internal-only metadata for this first implementation.
- [ ] 1.5 Add database storage for persisted AST if needed, including migration and Drizzle schema updates.
- [ ] 1.6 Add AST validation tests covering valid structures and rejection of raw HTML, unknown blocks, unknown marks, and malformed provider output.

## 2. Conversion Layer

- [ ] 2.1 Implement AST to Tiptap JSON conversion for supported blocks, marks, alignment, indentation, page breaks, tables, and signatures.
- [ ] 2.2 Implement AST to compatibility text conversion for `draftContent`, text hashes, and text-adjustment compatibility.
- [ ] 2.3 Implement Tiptap JSON to AST normalization for supported editor saves.
- [ ] 2.4 Implement legacy fallback resolution from persisted AST, then `draftContentJson`, then `draftContent`.
- [ ] 2.5 Add converter tests for generation fixtures, edited Tiptap JSON, and legacy Markdown/text documents.

## 3. Generation Pipeline

- [ ] 3.1 Update generation recipe assets and prompt builders to request structured document output instead of DOCX, HTML, OOXML, or raw Markdown-only content.
- [ ] 3.2 Add provider response parsing for the structured document envelope.
- [ ] 3.3 Validate generated AST before completing a generation run.
- [ ] 3.4 Persist AST, derived Tiptap JSON, derived compatibility text, and updated metadata in successful generation.
- [ ] 3.5 Fail or retry generation when structured output is invalid instead of completing with malformed content.
- [ ] 3.6 Add debug metadata for structured output validation and projection status when debug mode is requested.
- [ ] 3.7 Update focused generation tests for valid structured output, invalid structured output, and legacy pipeline fallback behavior.

## 4. Document Editing And Reads

- [ ] 4.1 Update document detail serialization to resolve structured content and keep existing text and Tiptap response compatibility.
- [ ] 4.2 Update document save handling to normalize incoming Tiptap JSON through AST before persistence.
- [ ] 4.3 Keep stale-save hashing aligned with the canonical structured/editor content chosen for saves.
- [ ] 4.4 Reject unsupported editor content with a clear application error.
- [ ] 4.5 Update document edit and preview tests for save, reload, legacy fallback, and JSON parity.

## 5. DOCX Export API

- [ ] 5.1 Add a server-side DOCX writer dependency and keep it scoped to the API package.
- [ ] 5.2 Implement AST to DOCX rendering for headings, paragraphs, inline marks, lists, tables where supported, alignment, indentation, page breaks, placeholders, clauses, and signatures.
- [ ] 5.3 Add document export service logic that loads documents with existing visibility rules and resolves structured content.
- [ ] 5.4 Add protected DOCX export route, headers, filename generation, lifecycle checks, and error handling.
- [ ] 5.5 Add API tests that verify authorization, non-exportable states, response headers, and generated DOCX validity.

## 6. API Contracts And Client

- [ ] 6.1 Add or update Zod route schemas for structured fields and DOCX export metadata.
- [ ] 6.2 Regenerate OpenAPI and Postman artifacts when route contracts change.
- [ ] 6.3 Regenerate `@licitadoc/api-client` after OpenAPI changes.
- [ ] 6.4 Update client-side API helpers for binary DOCX download.

## 7. Frontend Export Experience

- [ ] 7.1 Wire the preview `Exportar DOCX` action to the protected export endpoint.
- [ ] 7.2 Preserve disabled DOCX states for generating, failed, inaccessible, and empty documents.
- [ ] 7.3 Show a clear export failure toast or inline error when DOCX download fails.
- [ ] 7.4 Add web tests for enabled export, disabled states, and download request behavior.

## 8. Verification

- [ ] 8.1 Run focused API document tests.
- [ ] 8.2 Run focused web document preview and edit tests.
- [ ] 8.3 Run typecheck for affected packages.
- [ ] 8.4 Run OpenSpec validation for `adopt-structured-document-ast-docx-export`.
- [ ] 8.5 Manually verify a generated or fixture-backed completed document exports to an openable `.docx`.
