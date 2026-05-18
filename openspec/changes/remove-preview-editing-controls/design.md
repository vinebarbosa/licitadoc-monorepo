## Context

The document preview route currently renders generated document content and also owns the text-adjustment interaction: it tracks browser selections, opens the "Ajustar texto" floating panel, calls adjustment suggestion/apply mutations, and renders a pending replacement overlay. This duplicates editing behavior on a route whose purpose is inspection and export.

The dedicated document editing page remains the correct place for mutating document content. The preview route should continue to support viewing completed content, live generation preview, empty/failed states, print, and export actions.

## Goals / Non-Goals

**Goals:**
- Make the document preview route read-only for document content.
- Remove preview-owned text adjustment UI, state, selection handlers, pending overlays, and mutation calls.
- Preserve current preview rendering, generation-progress, print, and export behavior.
- Update preview tests to assert that text selection does not open editing UI or call adjustment endpoints.

**Non-Goals:**
- Changing backend adjustment endpoints or authorization rules.
- Removing text adjustment capability from the dedicated editing page.
- Redesigning the document editor or generated document rendering components.
- Implementing export behavior beyond the current preview actions.

## Decisions

1. Remove preview adjustment behavior at the UI boundary.

   The preview component should stop importing `Textarea`, `Sparkles`, `useDocumentTextAdjustmentSuggestion`, and `useDocumentTextAdjustmentApply`, and should remove the panel, skeleton overlay, selection state, and related callbacks from `DocumentPreviewPageUI` and `DocumentSheet`. This keeps the route's behavior aligned with its read-only product role.

   Alternative considered: leave the panel mounted but hide it behind a feature flag. That preserves unused editing code in preview and keeps the route conceptually ambiguous, so it does not match the requested product behavior.

2. Keep text selection as native browser selection only.

   Users may still select and copy text from the preview, but the application should not intercept selection to start an edit workflow. `DocumentSheet` can render document content without an `onMouseUp` adjustment handler or overlay props.

   Alternative considered: show a "Go to editor" prompt after selection. That still introduces editing affordances inside preview and is outside this change.

3. Limit test updates to preview behavior.

   Preview tests that currently assert the adjustment panel, suggestion request, apply request, or pending skeleton should be removed or rewritten to assert read-only behavior. Existing tests for loading, generated output, live generation, print/export affordances, failure states, and document rendering should remain.

   Alternative considered: moving all adjustment tests to the editor page in this change. That may be useful later, but this change should avoid broad test migration unless the editor already owns equivalent behavior.

## Risks / Trade-offs

- Users who discovered adjustment from preview lose that entry point -> Editing remains available through the dedicated edit route, keeping the product model clearer.
- Removing preview adjustment tests may reduce coverage for the adjustment API flow -> Keep or add coverage in editor tests if the edit page owns the same capability.
- Frontend adjustment hooks may become unused after preview cleanup -> Remove unused imports/code if no other frontend surface consumes them; leave backend and generated client contracts untouched.

## Migration Plan

1. Remove preview adjustment UI and state from `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
2. Update preview tests in `apps/web/src/modules/documents/pages/document-preview-page.test.tsx` to assert read-only selection behavior and remove obsolete adjustment-flow expectations.
3. Run the web test target covering document preview.
4. Rollback by restoring the removed preview adjustment UI and tests if product direction changes.

## Open Questions

- None.
