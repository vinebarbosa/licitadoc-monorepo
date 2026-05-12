## Why

The document preview route already has real data loading, protected routing, and safe Markdown rendering, but its visual structure does not yet match the validated document preview UI from `tmp/documento-preview.tsx`. Adopting that UI inside the current architecture gives users a more document-like review surface without regressing the runtime behaviors that already exist.

## What Changes

- Use `tmp/documento-preview.tsx` as the validated visual reference for the protected document preview page.
- Adapt the current `apps/web` document preview implementation to a document-sheet layout with top actions, official-style document header, object/process context, preview body, and signature/footer affordance where data allows.
- Preserve existing API-backed behavior for document detail loading, breadcrumbs, Markdown rendering, polling/status handling, retryable errors, forbidden/not-found states, generating/failed states, and empty-content states.
- Keep the implementation inside the current frontend architecture, using `@/modules/documents`, `@/modules/app-shell`, and `@/shared/ui` primitives instead of runtime imports from `tmp`.
- Add print/export affordances as UI controls, but do not introduce backend export generation unless an existing route or client contract already supports it.

## Capabilities

### New Capabilities
- `web-document-preview-validated-ui`: Covers the validated document-preview visual structure and action surface adapted from `tmp/documento-preview.tsx`.

### Modified Capabilities

## Impact

- Affects `apps/web/src/modules/documents/ui/document-preview-page.tsx` and related document preview tests.
- May add or adjust document-preview model helpers for document title, process/object labels, action links, and metadata fallback text.
- Does not require backend API, database, generated client, or dependency changes.
