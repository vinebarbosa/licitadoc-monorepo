## 1. Export Utility

- [x] 1.1 Choose and add the smallest client-side dependency set needed to generate PDFs from rendered preview pages.
- [x] 1.2 Create a document preview PDF export utility that accepts rendered `.pagedjs_page` elements and a target file name.
- [x] 1.3 Ensure the utility exports pages in order and uses A4 page sizing.
- [x] 1.4 Ensure the utility reports controlled errors when no rendered pages are available.

## 2. Preview Toolbar Behavior

- [x] 2.1 Keep the "Imprimir" button wired only to `window.print()`.
- [x] 2.2 Wire "Exportar PDF" to the PDF export utility instead of `window.print()`.
- [x] 2.3 Add pending state and repeated-click protection for PDF export.
- [x] 2.4 Keep PDF export disabled for generating, failed, or contentless previews.
- [x] 2.5 Show a concise toast or inline error when PDF export fails.

## 3. Tests

- [x] 3.1 Update document preview tests to assert that "Imprimir" calls `window.print()`.
- [x] 3.2 Update document preview tests to assert that "Exportar PDF" does not call `window.print()`.
- [x] 3.3 Add unit coverage for the PDF export utility's empty-page failure path.
- [x] 3.4 Add coverage for PDF export pending/disabled behavior.

## 4. Verification

- [x] 4.1 Run focused document preview tests.
- [x] 4.2 Run typecheck for `@licitadoc/web`.
- [x] 4.3 Run Biome check for changed document preview files.
- [x] 4.4 Manually verify in the local app that a completed preview downloads a `.pdf` file and print still opens the print flow.
