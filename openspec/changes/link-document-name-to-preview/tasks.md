## 1. Listing Link Fix

- [x] 1.1 Update the documents table name link to use `getDocumentPreviewLink(doc)`.
- [x] 1.2 Keep the `Visualizar` dropdown action pointing to the same preview URL.
- [x] 1.3 Leave the `Editar` dropdown action unchanged.

## 2. Regression Tests

- [x] 2.1 Update documents listing tests to assert document-name links point to `/app/documento/:documentId/preview`.
- [x] 2.2 Add coverage that the document-name link does not point to `/app/documento/:documentId`.
- [x] 2.3 Assert the `Visualizar` row action remains aligned with the preview route.

## 3. Validation

- [x] 3.1 Run focused documents listing tests.
- [x] 3.2 Run web typecheck and Biome checks for changed files.
- [x] 3.3 Run OpenSpec validation for the change.
