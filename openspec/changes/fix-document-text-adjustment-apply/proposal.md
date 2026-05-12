## Why

The document text-adjustment flow can appear to apply a suggestion without changing the preview because backend apply failures may be treated as frontend success. This is especially visible when the user selects rendered Markdown text whose source representation differs from the stored `draftContent`.

## What Changes

- Ensure text-adjustment apply requests surface HTTP validation/conflict errors as failures in the web UI instead of success toasts.
- Make accepted suggestions update the visible document preview only after the backend persists the replacement.
- Resolve selected rendered text against the Markdown source robustly enough for administrative fields, lists, and normal paragraph selections.
- Preserve deterministic safeguards for stale, ambiguous, unauthorized, or empty adjustment requests.
- Add focused backend and web tests covering rendered-selection/source-Markdown mismatch and apply error handling.

## Capabilities

### New Capabilities
- `document-text-adjustment-application`: Covers reliable application and error handling for accepted document text-adjustment suggestions.

### Modified Capabilities

## Impact

- Affects `apps/api/src/modules/documents/document-text-adjustment.ts` target resolution and apply behavior.
- Affects document adjustment API routes/schemas only if a more stable target token or source-offset contract is introduced.
- Affects `packages/api-client/src/client.ts` or document-specific web API wrappers so generated mutations fail on non-2xx responses.
- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx` apply success/error handling and query refresh behavior.
- Adds focused API and web coverage for successful apply, conflict visibility, and rendered Markdown selection cases.
