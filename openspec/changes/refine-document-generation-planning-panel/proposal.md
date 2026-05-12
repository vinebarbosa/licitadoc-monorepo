## Why

The live document preview can now receive planning/thinking progress, but rendering the raw accumulated reasoning as a large text block feels technical and visually heavy for the document workspace. The preview needs a compact, polished planning panel that reassures the user the AI is preparing the document without exposing detailed raw reasoning in this iteration.

## What Changes

- Replace the raw `Raciocinio da IA` transcript-style block with a compact planning status panel in the document preview.
- Present concise phase/status messaging and subtle progress indicators instead of rendering raw planning content verbatim.
- Do not add a button, disclosure, drawer, or other control for detailed raw reasoning for now.
- Keep the generated document sheet, typewriter document text behavior, completion refresh, print/export disabled states, and realtime fallback unchanged.
- Keep planning/thinking content transient and separate from persisted document content, print output, and exports.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-document-live-preview`: planning/thinking progress must be presented as a compact status experience rather than a raw transcript while final document content remains clean.

## Impact

- `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend, database, API client, or SSE contract changes are expected.
