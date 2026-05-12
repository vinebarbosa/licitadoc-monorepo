## 1. Navigation Fix

- [x] 1.1 Update the document preview back action to link to `/app/documentos`.
- [x] 1.2 Rename the action copy so it no longer promises document editing.
- [x] 1.3 Confirm the preview actions keep print and export controls unchanged.

## 2. Regression Coverage

- [x] 2.1 Update document preview tests to assert the back action links to `/app/documentos`.
- [x] 2.2 Add or adjust coverage to ensure the preview action does not link to `/app/documento/:documentId`.
- [x] 2.3 Run focused document preview tests, web typecheck, and OpenSpec validation.
