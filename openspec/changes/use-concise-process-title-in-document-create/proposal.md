## Why

The document creation screen still shows the full process object inside the process picker, making the selector long and hard to scan after process titles became concise elsewhere. This should now align with the rest of the process experience by showing the reviewed concise title in the picker.

## What Changes

- Update the document creation process selector to use the process `title` as the primary display text.
- Keep the process number visible beside the title so users can still identify the linked process precisely.
- Preserve a graceful fallback for older or incomplete process responses that do not include a usable `title`.
- Avoid changing the generated document name behavior, which should continue to use the document type and process number unless separately customized.

## Capabilities

### New Capabilities
- `web-document-process-picker`: Covers how document creation UI presents selectable processes with concise titles and resilient fallbacks.

### Modified Capabilities

## Impact

- Affects the web document creation page at `apps/web/src/modules/documents/ui/document-create-page.tsx`.
- Affects document creation page tests and process picker fixtures under `apps/web/src/modules/documents/pages/` and `apps/web/src/test/msw/fixtures.ts`.
- Depends on process list responses exposing `title` from the concise process titles change, while still supporting object-derived fallback.
