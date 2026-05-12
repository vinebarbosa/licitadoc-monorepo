## Why

The document name in the documents listing currently links to `/app/documento/:documentId`, which is not a registered route. Users expect clicking the document name to open the document, and the existing supported destination for that is the preview page at `/app/documento/:documentId/preview`.

## What Changes

- Change the document-name link in the documents table to navigate to the document preview route.
- Keep the existing `Visualizar` menu action pointing to the same preview route.
- Keep the `Editar` menu action unchanged for now, even if a full editor route is not part of this change.
- Update listing tests to assert the name link uses `/app/documento/:documentId/preview` and does not point to the missing route.

## Capabilities

### New Capabilities
- `web-documents-list-preview-links`: Covers document-list navigation links that open document previews from the listing surface.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/documents-listing-page.tsx`.
- Affects `apps/web/src/modules/documents/pages/documents-page.test.tsx`.
- No API, database, route table, or generated client changes are expected.
