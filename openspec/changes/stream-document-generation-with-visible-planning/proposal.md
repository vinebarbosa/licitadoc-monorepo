## Why

Document generation should keep the model's explicit thinking enabled for quality while still giving the user a realtime experience. The current `think: false` change improves early document streaming, but it conflicts with the desired behavior for high-stakes procurement drafts; the system needs to stream planning/thinking separately from final document text.

## What Changes

- Re-enable Ollama thinking for document generation by removing the forced `think: false` request behavior.
- Extend the shared generation provider contract to expose optional non-document planning/thinking deltas separately from generated text deltas.
- Publish document generation realtime events for planning/thinking progress separately from document text chunks.
- Update the document preview live UI to show a separate planning/thinking area while keeping the document sheet populated only from final `response` text.
- Preserve the typewriter-style document preview for final document text as soon as `response` chunks arrive.
- Ensure planning/thinking content is transient UI feedback only and is never persisted as `draftContent`, exported, printed, or mixed into the final document.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `generation-provider`: provider adapters must be able to emit optional planning/thinking deltas separately from generated text deltas, and Ollama document generation must keep thinking enabled.
- `document-generation`: realtime generation events must distinguish transient planning/thinking progress from generated document text progress.
- `web-document-live-preview`: the preview UI must render planning/thinking progress separately from the final document preview and keep final document content clean.

## Impact

- `apps/api/src/shared/text-generation/ollama-provider.ts`
- `apps/api/src/shared/text-generation/types.ts`
- `apps/api/src/modules/documents/document-generation-worker.ts`
- `apps/api/src/modules/documents/document-generation-events.ts`
- `apps/api/src/modules/documents/routes.ts`
- `apps/web/src/modules/documents/api/documents.ts`
- `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- API and web tests for provider callbacks, SSE events, and live preview rendering.
- No database migration or API client regeneration is expected because planning/thinking remains transient and uses the hidden SSE route.
