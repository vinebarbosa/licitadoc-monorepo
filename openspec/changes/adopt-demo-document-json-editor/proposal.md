## Why

The public demo at `/demo/documento/editor` has already validated the intended document editing experience, but the protected document editor still does not use that interaction model. The current edit flow also converts between Markdown/HTML and Tiptap, which makes selection, formatting, and AI-assisted editing more fragile than storing the editor's native JSON document model.

## What Changes

- Adopt the validated `/demo/documento/editor` UI for the protected `/app/documento/:documentId` editor instead of redesigning the editing surface.
- Load and save editable document content as Tiptap JSON so the persisted shape matches the editor's native structure.
- Keep existing generated Markdown-like content available as a compatibility source for existing documents, previews, and exports while the editor works from JSON.
- Add server-side fallback conversion so documents generated before JSON storage can still open in the Tiptap editor.
- Update document update/read contracts, client types, and tests around JSON editing, stale-save protection, and preview compatibility.

## Capabilities

### New Capabilities
- `document-json-editing`: Covers the protected document editor using the validated agent-like Tiptap UI and native Tiptap JSON load/save behavior.

### Modified Capabilities
- `document-generation`: Document detail reads and persisted edit updates expose a Tiptap JSON representation for editable draft content while preserving generated content compatibility.

## Impact

- Web app: protected document edit route, document editor UI, document model helpers, document API hooks, tests, and routing exports.
- Public demo: remains the visual reference for the validated UI.
- API app: document schema, read/update schemas, serializers, update service, tests, and migration for JSON draft content.
- Database: add a JSONB column for Tiptap draft content, while keeping the existing text draft content for compatibility.
- API client: regenerate types after the document read/update contract changes.
