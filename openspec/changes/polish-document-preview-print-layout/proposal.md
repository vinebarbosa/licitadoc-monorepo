## Why

The document preview currently looks like an application card instead of a formal public-procurement document. It also adds misleading or duplicated UI-only content, such as missing-organization placeholders, an artificial object block, duplicated titles, and an extra signature footer.

Improving the visual layout now makes generated DFDs and other document types easier to review, print, and trust without changing the generation recipe or document text itself.

## What Changes

- Replace the generic card-based preview body with a formal document sheet that resembles an A4 page on screen.
- Remove hardcoded missing-data placeholders from the document surface when real organization or department metadata is not available.
- Avoid duplicating document titles, object sections, and signature blocks between the UI wrapper and the generated Markdown content.
- Remove the left-border treatment from the document body so the preview reads as the actual document, not as a quoted note.
- Improve Markdown typography for formal documents, including headings, paragraphs, lists, tables, horizontal rules, links, and code-safe fallbacks.
- Add print-specific styling so printing hides app chrome/actions and renders the document page with clean margins, no card shadow, and fewer awkward page breaks.
- Preserve existing live-generation preview behavior while applying the improved visual shell to both generated and completed documents.

## Capabilities

### New Capabilities

- `web-document-preview-layout`: Defines the formal on-screen and print presentation rules for generated document previews.

### Modified Capabilities

None.

## Impact

- Affected frontend UI:
  - `apps/web/src/modules/documents/ui/document-preview-page.tsx`
  - `apps/web/src/modules/documents/ui/document-markdown-preview.tsx`
  - `apps/web/src/styles.css`
- Affected tests:
  - `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend API, document recipe, or text-generation behavior changes are required for this scope.
