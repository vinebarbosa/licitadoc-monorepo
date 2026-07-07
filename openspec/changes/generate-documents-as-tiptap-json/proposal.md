## Why

Document generation still carries a text-first shape: the pipeline writes Markdown, reviews and rewrites that text, then projects the accepted draft into structured content and Tiptap JSON. This adds provider calls, latency, cost, and translation risk around the exact format the editor already needs.

The generation flow should make Tiptap-compatible JSON the authoritative generated document format. The model should return validated editor JSON directly, the backend should persist that JSON as the source of truth, and compatibility text should become a derived projection only.

## What Changes

- **BREAKING**: Generated document content becomes Tiptap JSON-first. `draftContentJson` is the authoritative generated content for new documents.
- **BREAKING**: The SD-backed local review and rewrite loop is removed from the generation pipeline. Provider output is accepted only after schema/domain validation, not after a text review pass.
- Replace the final structured-output projection call with direct provider generation of Tiptap-compatible JSON.
- Validate generated Tiptap JSON before marking a document generation as `completed`.
- Persist validated Tiptap JSON as the source of truth and derive `draftContent` compatibility text from it.
- Keep legacy document reads working for documents that only have `draftContentAst`, `draftContentJson`, or `draftContent`.
- Update document recipes and provider contracts so supported providers request direct JSON output rather than Markdown drafts.

## Capabilities

### New Capabilities

- `document-tiptap-json-output`: Defines the constrained Tiptap JSON output contract, validation behavior, and deterministic text projection for generated documents.

### Modified Capabilities

- `document-generation`: Generation completion and persistence now depend on validated Tiptap JSON, and the SD-backed review/rewrite loop is removed.
- `document-generation-recipes`: Repository-managed recipes must instruct providers to return the constrained Tiptap JSON document shape directly.
- `generation-provider`: Provider adapters must expose direct structured JSON generation for Tiptap output or fail/route through an explicit unsupported-provider path.

## Impact

- Affected backend modules: `apps/api/src/modules/documents/document-generation-pipeline.ts`, `document-generation-worker.ts`, document schemas, document read/list serialization, and generation tests.
- Affected shared modules: text-generation provider interface/adapters, OpenAI structured output request formatting, Tiptap JSON validation/projection helpers.
- Affected recipe assets: DFD, ETP, TR, Minuta, and base writer instructions.
- Data impact: new generated documents should persist authoritative `draftContentJson`; existing `draftContentAst` can remain readable as legacy/transition data.
- API impact: public document responses can remain compatible if `draftContentJson` and `draftContent` continue to be returned, but their source of truth changes for new generations.
