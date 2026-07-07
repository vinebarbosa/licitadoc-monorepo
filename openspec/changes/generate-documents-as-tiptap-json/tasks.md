## 1. Tiptap JSON Contract

- [x] 1.1 Define a constrained generated-document Tiptap JSON schema with allowed root, nodes, marks, and attributes.
- [x] 1.2 Add validators that reject malformed JSON, unsupported nodes/marks/attrs, empty content, unsafe payloads, and oversized structures.
- [x] 1.3 Add document-family validation for DFD, ETP, TR, and Minuta headings/sections in generated Tiptap JSON.
- [x] 1.4 Add deterministic `draftContentJson` to compatibility text projection tests for generated document fixtures.
- [x] 1.5 Add valid and invalid direct-json fixtures for DFD first, then ETP, TR, and Minuta.

## 2. Provider Contract

- [x] 2.1 Extend the shared text-generation provider contract with direct constrained Tiptap JSON output capability metadata.
- [x] 2.2 Add a provider request shape for direct Tiptap JSON generation using the shared schema.
- [x] 2.3 Update the OpenAI provider to request JSON schema output for the constrained Tiptap document.
- [x] 2.4 Ensure unsupported providers fail with a normalized capability error unless an explicit compatibility fallback is configured.
- [x] 2.5 Record output format, validation status, provider key, model, token usage, and cost metadata for direct-json calls.

## 3. Generation Pipeline

- [x] 3.1 Replace the SD-backed writer/humanization/review/rewrite/structured-output sequence with a direct Tiptap JSON generation path behind configuration.
- [x] 3.2 Remove local review and text rewrite execution from the direct-json path.
- [x] 3.3 Validate provider-returned Tiptap JSON before completing generation.
- [x] 3.4 Derive `draftContent` from validated `draftContentJson` before persistence.
- [x] 3.5 Stop writing the previous structured AST as authoritative content for new direct-json generations.
- [x] 3.6 Preserve the existing legacy/text path only as an explicit rollback or compatibility fallback.

## 4. Recipes And Prompts

- [x] 4.1 Update base writer instructions to require constrained Tiptap JSON as the final response.
- [x] 4.2 Update DFD recipe assets to describe DFD-only output in the constrained Tiptap JSON contract.
- [x] 4.3 Update ETP, TR, and Minuta recipe assets to describe their expected output in the constrained Tiptap JSON contract.
- [x] 4.4 Remove or rewrite prompt language that asks for Markdown as the final generated document.
- [x] 4.5 Add recipe tests proving prompts request direct Tiptap JSON and prohibit Markdown/HTML/DOCX output.

## 5. Persistence And Reads

- [x] 5.1 Persist validated direct-json output as authoritative `draftContentJson` for completed generated documents.
- [x] 5.2 Keep `draftContent` populated as a derived compatibility text field.
- [x] 5.3 Preserve document detail fallback for legacy rows with `draftContentAst`, existing `draftContentJson`, or text-only `draftContent`.
- [x] 5.4 Ensure document edit/update still saves `draftContentJson` and derives compatibility text consistently.
- [x] 5.5 Update generated API schemas/client if public response schemas change.

## 6. Tests And Verification

- [x] 6.1 Add focused unit tests for direct-json generation success and validation failure.
- [x] 6.2 Add tests proving direct-json generation metadata has no writer, humanization, review, rewrite, or structured-output stages.
- [x] 6.3 Add provider tests for OpenAI JSON schema request payloads and unsupported-provider failure.
- [x] 6.4 Add worker tests proving completed documents persist authoritative `draftContentJson` and derived `draftContent`.
- [x] 6.5 Add read serialization tests for legacy fallback order.
- [x] 6.6 Run focused API test suites for document generation pipeline, recipes, provider adapters, and document routes.
- [x] 6.7 Regenerate the API client if route schema output changes.
