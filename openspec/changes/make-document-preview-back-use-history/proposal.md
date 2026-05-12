## Why

The document preview back action should behave like a true browser-style back button, returning the user to whichever workflow brought them into the preview. A fixed `/app/documentos` destination is safe, but it loses context when the user arrived from a process detail page, creation flow, or another in-app location.

## What Changes

- Change the document preview back action to call history navigation (`go back`) instead of acting as a fixed link.
- Keep a safe fallback to `/app/documentos` when there is no usable in-app history entry.
- Use neutral copy such as `Voltar` so the action does not imply a specific destination or editing screen.
- Update tests to cover history navigation and fallback behavior.

## Capabilities

### New Capabilities
- `web-document-preview-history-back`: Covers browser-history-based back navigation on the document preview page.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
- Affects `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`.
- No API, database, routing table, or generated client changes are expected.
