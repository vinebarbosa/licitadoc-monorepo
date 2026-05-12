## Why

The document preview action "Voltar para edição" currently links to `/app/documento/:documentId`, but that route is not registered in the web router. Clicking it sends the user to a non-existent page from a primary preview action.

## What Changes

- Change the document preview back action so it always points to an existing route.
- Use the documents listing as the safe fallback destination while a dedicated document editing route does not exist.
- Rename or adjust the action copy if needed so the label matches the actual destination.
- Update preview tests to assert the corrected route and prevent regressions.

## Capabilities

### New Capabilities
- `web-document-preview-navigation`: Covers navigation actions exposed by the document preview page and their route validity.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
- Affects `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`.
- No API, database, or generated client changes are expected.
