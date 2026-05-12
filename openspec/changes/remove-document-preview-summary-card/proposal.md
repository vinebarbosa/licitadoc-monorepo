## Why

The document preview should match the validated temporary UI more strictly. The current architecture can still show an extra summary card with generated document title, document/process code, and last update before non-content states, which adds a visual block that is not part of the validated layout.

## What Changes

- Remove the standalone summary/metadata card from the document preview surface.
- Keep the top action row with return, print, DOCX export, and PDF export controls.
- Keep the document layout card as the primary preview surface for previewable content.
- Keep loading, retryable error, forbidden/not-found, generating, failed, and empty-content states functional without inserting the removed summary card.
- Preserve real API-backed document data, app-shell breadcrumbs, and safe Markdown rendering.

## Capabilities

### New Capabilities
- `web-document-preview-simplified-surface`: Covers the simplified document preview surface that keeps only top actions and document/preview state content.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
- Affects document preview tests that currently assert the standalone summary card or its title/process/updated metadata.
- No backend API, database, generated client, dependency, or route changes are expected.
