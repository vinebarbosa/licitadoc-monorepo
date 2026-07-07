## 1. Structured Output Schema

- [x] 1.1 Inspect current document generation, worker persistence, document detail serialization, Tiptap conversion, and text-adjustment flows.
- [x] 1.2 Define versioned LicitaDoc structured document output TypeScript types.
- [x] 1.3 Add Zod schemas for the structured envelope, block kinds, inline marks, metadata, placeholders, and signature blocks.
- [x] 1.4 Add representative valid fixtures for DFD, ETP, TR, Minuta, lists, tables, placeholders, page breaks, and signature blocks.
- [x] 1.5 Add invalid fixtures covering malformed JSON, raw HTML, unknown blocks, unknown marks, document-family mismatch, and missing required fields.
- [x] 1.6 Add validation tests proving valid fixtures pass and invalid fixtures fail before persistence.

## 2. Projection Converters

- [x] 2.1 Implement structured output to Tiptap JSON conversion for supported headings, paragraphs, lists, tables, placeholders, page breaks, and signature blocks.
- [x] 2.2 Implement structured output to compatibility text conversion for `draftContent`, text hashes, previews, and text-adjustment compatibility.
- [x] 2.3 Add converter tests that compare structured fixtures to expected Tiptap JSON and compatibility text.
- [x] 2.4 Add legacy resolution helpers that prefer structured output, then existing `draftContentJson`, then `draftContent` text conversion.
- [x] 2.5 Verify signature alignment and institutional closing behavior remain correct in derived `draftContentJson`.

## 3. Storage And API Compatibility

- [x] 3.1 Decide and implement the first storage path for structured output, preferring a typed JSONB column such as `draft_content_ast`.
- [x] 3.2 Add any required database migration and Drizzle schema updates.
- [x] 3.3 Update document serializers to preserve existing `draftContent` and `draftContentJson` response compatibility.
- [x] 3.4 Add additive structured metadata exposure only if needed, with Zod-backed schemas.
- [x] 3.5 Add read tests for documents with structured output, documents with only `draftContentJson`, and documents with only `draftContent`.

## 4. Provider Interface

- [x] 4.1 Extend the shared text-generation provider contract to request structured output or report structured-output capability.
- [x] 4.2 Update the OpenAI provider to use structured output/schema support when structured generation is requested.
- [x] 4.3 N/A: Gemini provider implementation discarded by product decision.
- [x] 4.4 Preserve the existing Markdown/text generation path as an explicit fallback for unsupported providers or disabled structured generation.
- [x] 4.5 Add provider tests for structured requests, unsupported models/providers, usage metadata, and invalid structured responses.

## 5. Recipes And Prompt Assembly

- [x] 5.1 Update base writer instructions to describe structured JSON output when structured generation is enabled.
- [x] 5.2 Update DFD recipe prompt assembly to include DFD structured-output boundaries and prohibit Markdown code fences as final output.
- [x] 5.3 Update ETP, TR, and Minuta recipe prompt assembly with document-family-specific structured-output boundaries.
- [x] 5.4 Keep Markdown templates available only as structural guidance or fallback context, not as the authoritative final output contract.
- [x] 5.5 Add recipe tests asserting structured-output instructions are present and Markdown-only final-output rules are not used when structured generation is enabled.

## 6. Generation Pipeline

- [x] 6.1 Update the pipeline to request structured output for supported document types when enabled.
- [x] 6.2 Parse and validate the provider structured envelope before any completed document persistence.
- [x] 6.3 Derive `draftContentJson` and `draftContent` from validated structured output during successful generation.
- [x] 6.4 Implement controlled retry or repair behavior for invalid structured output, then fail safely if validation still fails.
- [x] 6.5 Ensure failed structured validation records useful generation-run error code, error message, and safe debug metadata.
- [x] 6.6 Preserve live progress and planning events without requiring partial JSON streaming.
- [x] 6.7 Add focused pipeline tests for valid structured output, invalid output, retry/failure, and fallback Markdown behavior.

## 7. Integration And Cost Checks

- [x] 7.1 Generate a DFD fixture through the structured path using a stub provider and verify completed persistence.
- [x] 7.2 Verify `gpt-4.1-mini`-style code-fence output fails validation or is repaired before completion.
- [x] 7.3 Compare structured output token/cost metadata against the current Markdown path for a representative DFD.
- [x] 7.4 Confirm existing document preview/editor reads still work for newly generated and legacy documents.

## 8. Verification

- [x] 8.1 Run focused API tests for document generation recipes, structured output validation, converters, and document reads.
- [x] 8.2 Run focused provider tests for OpenAI and fallback behavior.
- [x] 8.3 Run `pnpm --filter @licitadoc/api typecheck`.
- [x] 8.4 Run targeted lint/format checks for changed API files.
- [x] 8.5 Run `openspec validate adopt-structured-generation-output --strict` or the repository's equivalent OpenSpec validation command.
