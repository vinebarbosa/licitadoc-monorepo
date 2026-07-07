## Why

Generated documents are still produced as Markdown text and then converted into editor JSON with heuristics. Recent provider tests exposed the weakness of that contract: cheaper models can wrap the document in code fences, leak formatting instructions, or drift into Markdown patterns that must be cleaned after the fact.

LicitaDoc already stores and serves `draftContentJson` for editor and preview use. The generation step should move closer to that structured path by accepting validated JSON/AST as the provider contract, then deriving the current text and Tiptap projections from that structured source.

## What Changes

- Introduce a small LicitaDoc structured document output envelope for generated procurement documents.
- Ask supported providers to return structured JSON for generated DFD, ETP, TR, and Minuta drafts instead of raw Markdown-only content.
- Validate provider output before a generation run is completed; invalid JSON, unsupported blocks, raw HTML, or malformed structure must fail or retry instead of being persisted as completed content.
- Convert valid structured output into the existing `draftContentJson` editor projection and `draftContent` compatibility text.
- Preserve current live generation progress behavior as best effort, but make the completed stored document come from the validated structured result.
- Keep legacy Markdown/text generation paths available only as fallback behavior during migration or for unsupported providers.
- Do not include DOCX export in this change; export can build on the structured output later.

## Capabilities

### New Capabilities

- `document-structured-output`: Defines the validated JSON/AST envelope used as the final provider output contract for generated documents.

### Modified Capabilities

- `document-generation`: Successful generation must validate structured output and persist derived editor/text projections from it.
- `document-generation-recipes`: Repository-managed recipes must describe structured output boundaries instead of treating Markdown as the authoritative final generation contract.

## Impact

- Affected backend modules: `apps/api/src/modules/documents`, document generation pipeline, document worker persistence, generation recipes, shared Tiptap conversion utilities, and document tests.
- Affected provider modules: OpenAI can use structured output/schema support where available; unsupported providers remain on the explicit Markdown/text fallback path.
- Database impact: may add a JSONB structured-content column, or may initially store validated structured content in metadata while continuing to persist `draftContentJson` and `draftContent` projections.
- API impact: normal document detail responses can remain compatible; any exposed structured metadata should be additive and Zod-backed.
- Existing generated documents remain readable through current `draftContent`/`draftContentJson` fallback behavior.
