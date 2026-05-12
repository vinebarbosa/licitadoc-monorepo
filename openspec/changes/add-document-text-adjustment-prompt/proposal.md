## Why

Users can preview generated procurement documents, but correcting wording still requires leaving the preview or manually editing large blocks of text. A ChatGPT-like floating prompt lets the user request focused textual adjustments while preserving the institutional tone and context of the current document.

## What Changes

- Add a floating text-adjustment entry point to the document preview when the user selects text inside the rendered document.
- Allow the user to type an instruction describing what should change in the selected excerpt.
- Generate an adjusted replacement that considers the selected text, nearby/full document context, document type, and process metadata so the result keeps the same formal tone.
- Let the user apply or discard the suggested replacement before the stored draft content changes.
- Surface loading and error states without disrupting existing preview, print, and export actions.

## Capabilities

### New Capabilities
- `document-text-adjustment`: Covers selection-based document text adjustment from the preview using user-provided instructions and document context.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx` and related preview components/tests.
- Affects document API routes, schemas, and client generation if a new adjustment endpoint is added.
- Affects backend document services and generation provider usage for prompt-based text rewriting.
- May require persisting updated draft content and invalidating/refetching document detail queries after an accepted adjustment.
