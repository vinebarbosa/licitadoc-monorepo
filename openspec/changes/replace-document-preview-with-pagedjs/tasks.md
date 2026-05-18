## 1. Audit and Integration Prep

- [x] 1.1 Review the current official preview flow in `DocumentPreviewPageUI` and identify the exact completed-document render branch to replace.
- [x] 1.2 Review the stabilized `paged-preview` module and note any demo-only props, URLs, or layout assumptions that must become official inputs.
- [x] 1.3 Confirm how the official document response exposes `draftContentJson`, `draftContent`, status, title, document type, and `document.letterhead.url`.

## 2. Paged Preview Module Hardening

- [x] 2.1 Adjust `DocumentPreview`/`PaperLayout` props so the official page can pass real document content, metadata, print labels, and letterhead URL.
- [x] 2.2 Ensure `usePagedPreview` clears stale output, ignores obsolete renders, and does not duplicate pages after content or letterhead changes.
- [x] 2.3 Keep the letterhead applied as full-page A4 background on generated Paged.js pages, not as an image inside the body flow.
- [x] 2.4 Ensure the hidden source container never appears in the visible preview or printed output.

## 3. Content Source Conversion

- [x] 3.1 Implement or reuse a safe renderer that converts `draftContentJson` into the HTML/React body consumed by Paged.js.
- [x] 3.2 Keep a safe fallback path for legacy `draftContent` when JSON is absent.
- [x] 3.3 Verify headings, paragraphs, lists, tables, signatures, and long sections keep document-style formatting in the paged body.

## 4. Official Preview Replacement

- [x] 4.1 Replace the completed renderable document branch in `/app/documento/:documentId/preview` with the Paged.js renderer.
- [x] 4.2 Preserve loading, generating, failed, empty, retry, back navigation, and read-only action behavior outside the paged document body.
- [x] 4.3 Preserve the existing non-renderable/legacy fallback so unsupported documents do not break the preview route.
- [x] 4.4 Keep the Paged.js demo route available as a regression fixture during rollout.

## 5. Print and PDF Behavior

- [x] 5.1 Wire "Imprimir" and "Exportar PDF" to print the official Paged.js output with `window.print()`.
- [x] 5.2 Hide app shell, toolbar actions, screen backgrounds, shadows, and hidden source containers in print media.
- [x] 5.3 Remove or isolate old print/page CSS that conflicts with Paged.js page size, page margins, or letterhead backgrounds.
- [x] 5.4 Validate browser print with default margins and no margins, with background graphics enabled.

## 6. Verification

- [x] 6.1 Add or update tests for completed JSON preview rendering through Paged.js.
- [x] 6.2 Add or update tests for legacy `draftContent` fallback.
- [x] 6.3 Add or update tests for loading, generating, failed, empty, and retry states.
- [x] 6.4 Add or update tests or assertions that rerendering does not duplicate generated pages or fixed layers.
- [x] 6.5 Run the web test/typecheck commands used by the repository for the touched package.
- [x] 6.6 Manually verify the official preview with a real document that has the Pureza letterhead, multiple pages, lists, and tables.
