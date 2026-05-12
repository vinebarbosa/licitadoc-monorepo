## Why

The compact planning panel now avoids raw reasoning, but the experience still feels too static and simple for a long-running document generation flow. Users should see a more engaging, trustworthy sense of progress while the AI prepares the document, using a vertical timeline/stepper that feels alive without becoming visually noisy.

## What Changes

- Replace the current simple planning phase grid with a compact vertical stepper/timeline inside the generation tracking card.
- Show a richer sequence of product-facing generation steps, not only three generic phases.
- Automatically scroll the stepper so the active step moves through the card as generation progresses.
- Animate active, completed, and pending steps with subtle motion, active pulse, and state changes that fit the app's restrained document workspace.
- Preserve accessibility by supporting reduced-motion preferences and keeping the stepper understandable without animation.
- Continue hiding raw detailed reasoning and avoid adding any raw reasoning button/disclosure.
- Keep planning progress transient and separate from the generated document body, exports, and persisted content.
- Keep backend/provider/SSE contracts unchanged; derive the stepper state from existing planning/content stream state on the frontend.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-document-live-preview`: the planning progress panel must become an animated vertical stepper with automatic vertical scrolling and richer product-facing generation stages.

## Impact

- `apps/web/src/modules/documents/ui/document-preview-page.tsx`
- `apps/web/src/modules/documents/pages/document-preview-page.test.tsx`
- No backend, database, API client, provider, or SSE contract changes are expected.
