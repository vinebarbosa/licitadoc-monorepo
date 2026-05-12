## Why

The live document preview already writes generated content progressively, but the page can remain scrolled above the newly written text while the document grows. Users should be able to watch the document being written without manually scrolling down as new content appears.

## What Changes

- Add auto-follow behavior to the document preview while live generated text is being rendered.
- When the document sheet first becomes available and the typewriter content grows, keep the viewport following the newest visible text.
- Respect user intent by pausing auto-follow if the user manually scrolls away from the live writing area.
- Resume or keep following while the user remains near the bottom/newest content.
- Respect reduced-motion preferences by avoiding smooth animated scrolling when reduced motion is requested.
- Preserve the existing typewriter rendering, planning stepper, disabled export/print states, stream fallback, and completion refetch behavior.
- Keep this frontend-only; no backend, provider, database, API client, or SSE contract changes are expected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-document-live-preview`: the live document preview must keep the viewport aligned with newly visible generated text while preserving user-controlled scrolling and accessibility preferences.

## Impact

- `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend/API/database changes expected.
