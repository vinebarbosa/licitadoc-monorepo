## Context

The current SD-backed generation pipeline is still organized around a human-readable draft. It can call a writer, optionally humanize the draft, run a local review/rewrite loop, and then make a final structured-output call that projects the accepted text into validated structured content and Tiptap JSON.

That shape solved earlier quality issues, but it now duplicates work. The editor, preview, update route, and document reads already consume `draftContentJson`; generation should produce that format directly and make it authoritative for new generated documents.

## Goals / Non-Goals

**Goals:**

- Generate `draftContentJson` directly from the provider for DFD, ETP, TR, and Minuta.
- Treat validated Tiptap JSON as the source of truth for new generated documents.
- Remove the SD-backed local review and rewrite loop from generation.
- Keep compatibility `draftContent` as a deterministic projection from `draftContentJson`.
- Keep legacy documents readable when they only have `draftContentAst`, `draftContentJson`, or `draftContent`.
- Preserve provider-agnostic routing while requiring explicit direct-JSON support for the new path.

**Non-Goals:**

- Do not ask providers to return Markdown, HTML, DOCX, OOXML, base64 files, or the previous LicitaDoc AST as the final generation format.
- Do not keep the existing review/rewrite loop as a hidden phase in the new default path.
- Do not change the frontend editor to consume a new document model.
- Do not migrate every historical document row in the same change.
- Do not solve collaborative editing or native AST-range text adjustments.

## Decisions

### Decision: Make `draftContentJson` authoritative for new generations

New generated documents should be completed only from validated Tiptap-compatible JSON. The worker should persist that JSON in `draftContentJson`, derive `draftContent` with `tiptapJsonToDocumentText`, and avoid writing `draftContentAst` for new direct-json generations unless a transitional metadata field is needed for diagnostics.

Alternative considered: keep the LicitaDoc AST as the source of truth and project to Tiptap. Rejected for this change because the user-facing editor already expects Tiptap JSON, and the goal is to remove the final projection call rather than move it elsewhere.

### Decision: Constrain the Tiptap JSON contract instead of accepting arbitrary editor JSON

The provider-facing schema should be a strict subset of Tiptap JSON owned by LicitaDoc. It should require root `{ "type": "doc" }` and allow only supported node/mark types such as heading, paragraph, text, bulletList, orderedList, listItem, table nodes if supported by the editor, horizontalRule/page-break representation if already supported, and the attributes the renderer understands.

The backend should validate more than `type === "doc"` before completing generation. Unknown nodes, unknown marks, raw HTML-like payloads, unsupported attributes, document-family mismatches, empty content, or unsafe oversized structures should fail the run or enter an explicit structured repair path.

Alternative considered: accept any Tiptap JSON accepted by the editor. Rejected because a broad editor schema is too permissive for procurement generation and would let unsupported presentation or unsafe content become completed documents.

### Decision: Replace review/rewrite with validation-only completion

The new generation path should not call local review or text rewrite. Quality control moves to provider prompt constraints, schema validation, document-family validation, deterministic projection tests, and eventual manual editing in the editor.

Alternative considered: generate JSON directly and still convert it to text for the existing local review. Rejected because it keeps a text-first gate, adds complexity, and conflicts with the explicit goal that no review is needed.

### Decision: Use provider structured output for the single generation call

For OpenAI-backed generation, the adapter should request JSON schema output for the constrained Tiptap document shape. The shared provider interface can expose a typed structured request for direct document JSON generation while preserving provider-independent metadata and errors.

Providers that cannot reliably return structured JSON should either be marked unsupported for this path or routed only when a fallback flag is explicitly enabled. The new default should not silently return Markdown and convert it after the fact.

Alternative considered: ask unsupported providers to return JSON in plain text and parse it best-effort. Rejected as the default because it recreates the brittle post-processing path this change is meant to remove.

### Decision: Keep reads and edits backward compatible

Document detail serialization should prefer authoritative `draftContentJson` for new documents. Existing rows remain readable through the current fallback order: valid Tiptap JSON, legacy structured AST projection, then text conversion. Manual editor updates should continue to save `draftContentJson` and derive `draftContent`.

Alternative considered: migrate all historical documents immediately. Rejected because read-time fallback already supports old rows, and a broad data migration would increase risk without being necessary for the new generation path.

## Risks / Trade-offs

- [Risk] Direct JSON generation may produce less polished prose than the text-first writer/humanization path. -> Mitigation: start behind configuration, test with representative DFD/ETP/TR/Minuta fixtures, and compare generated document quality before making it unconditional.
- [Risk] Tiptap JSON schemas can become large and provider-specific. -> Mitigation: keep the provider contract to the smallest supported node subset and generate vendor JSON schema from shared Zod/types.
- [Risk] Removing review may allow semantically weak but schema-valid documents to complete. -> Mitigation: enforce document-family validation, required-section checks where feasible, placeholder rules, and source-fact constraints in prompts and validators.
- [Risk] Unsupported providers lose generation capability under the new default. -> Mitigation: expose capability metadata and fail with a controlled provider error instead of silently degrading to Markdown.
- [Risk] Existing adjustment flows operate on text. -> Mitigation: keep `draftContent` derived and continue saving editor edits through Tiptap JSON until native range/AST edits are designed separately.

## Migration Plan

1. Add constrained Tiptap JSON schemas, validators, fixtures, and JSON-to-text projection tests.
2. Extend the text-generation provider contract to request direct Tiptap JSON and advertise direct-json support.
3. Update OpenAI provider requests to use JSON schema output for the constrained Tiptap document.
4. Replace the SD-backed writer/humanization/review/rewrite/structured-output sequence with one direct Tiptap JSON generation call.
5. Persist validated `draftContentJson` as authoritative and derive `draftContent` before completing the generation run.
6. Update document recipes and prompt assembly to instruct direct Tiptap JSON output.
7. Keep legacy read fallback for old rows and remove new writes to `draftContentAst` from the direct-json path.
8. Roll back by disabling the direct-json generation flag and returning to the existing text/structured-output path until confidence is sufficient.

## Open Questions

- Should direct Tiptap JSON generation launch for all document types at once, or start with DFD and expand after quality checks?
- Should `draftContentAst` be left unused for new generations immediately, or should it be kept temporarily in metadata for audit/debug comparison?
- Should unsupported providers fail hard, or should development-only providers keep a flagged fallback for local testing?
