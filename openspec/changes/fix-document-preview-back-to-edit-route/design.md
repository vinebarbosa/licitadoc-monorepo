## Context

The document preview page renders a top action labeled "Voltar para edição". Its link target is `/app/documento/:documentId`, but the web router currently registers only `/app/documento/novo` and `/app/documento/:documentId/preview` for document-specific routes. There is no dedicated document editing page yet, so the current action leads to a broken route.

## Goals / Non-Goals

**Goals:**
- Ensure the preview back action never links to a non-existent route.
- Make the action copy match the real navigation target.
- Keep the preview export and print actions unchanged.
- Add regression coverage for the corrected destination.

**Non-Goals:**
- Build a document editing page.
- Add a new `/app/documento/:documentId` route.
- Change document generation, preview rendering, export, or API behavior.

## Decisions

1. Route the action to `/app/documentos`.

   The documents listing is the nearest existing stable destination for leaving the preview. A future document editing page can replace this target when it exists. The alternative of creating a placeholder `/app/documento/:documentId` route would hide the broken link but still not provide editing functionality.

2. Rename the action from "Voltar para edição" to "Voltar para documentos".

   Because there is no editing page, keeping "edição" in the label would remain misleading even with a valid destination. The alternative of keeping the label and only fixing the `href` would avoid visual churn but preserve the false promise.

3. Keep this as a frontend-only change.

   The issue is a route/link mismatch in the web UI. No backend or generated client behavior is involved.

## Risks / Trade-offs

- Users who expect editing may wonder where to edit a document -> Use truthful copy and keep the future editing route out of scope until an editor exists.
- Existing tests assert the broken URL -> Update them to assert a valid, registered route.
- Future editor implementation could forget to restore this action -> Keep the behavior covered in the document preview navigation spec so a later change can intentionally modify it.
