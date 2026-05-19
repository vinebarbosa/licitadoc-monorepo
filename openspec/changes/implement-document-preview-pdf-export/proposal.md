## Why

The document preview toolbar currently exposes both "Imprimir" and "Exportar PDF", but both actions call the browser print flow. This makes the UI feel duplicated and undermines user trust in the export action.

## What Changes

- Keep the "Imprimir" action as the browser print workflow.
- Change "Exportar PDF" so it generates and downloads a `.pdf` file directly from the rendered paged preview.
- Disable or show a pending state for PDF export while the paged preview is still rendering or when no completed preview exists.
- Preserve the existing print-only CSS behavior so printing still outputs only the official document pages.
- Add focused tests covering the separation between print and PDF export actions.

## Capabilities

### New Capabilities

- `web-document-preview-pdf-export`: Covers direct PDF file export from the document preview toolbar and the distinct behavior of print vs PDF actions.

### Modified Capabilities

- None.

## Impact

- Affected UI: document preview toolbar at `/app/documento/:documentId/preview`.
- Affected dependencies: likely add a small client-side PDF generation path, such as `jspdf` plus page capture support, unless an existing dependency can generate the file reliably.
- Affected tests: document preview page tests and any helper tests for PDF export utilities.
- No API contract changes are expected.
