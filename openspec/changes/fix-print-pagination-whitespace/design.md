## Context

The document preview now renders completed TipTap JSON through a shared pagination surface. On screen, automatic pagination uses measured top-level blocks, page frames, and transient spacer styles so overflowing blocks visually start inside the next sheet.

The print path is different: browser print already has physical pages, so the screen spacer height must not remain part of the printed flow. The current global print CSS hides page frames and resets some pagination attributes, but the pagination surface also injects per-boundary CSS with exact selectors, `!important` spacing, and source order after the global stylesheet. That dynamic CSS can win during print and produce large blank areas before the next printed page.

The saved TipTap JSON must remain unchanged. Automatic pagination boundaries are derived UI state only.

## Goals / Non-Goals

**Goals:**

- Print paginated previews without large blank areas caused by screen-only pagination spacers.
- Keep automatic and manual boundaries mapped to browser print page breaks where supported.
- Keep the screen preview visually unchanged, including page frames, shadows, gaps, and block displacement.
- Make dynamic pagination CSS intentionally print-aware so it does not override global print resets.
- Add focused tests that catch regressions in dynamic boundary CSS and preview print selectors.

**Non-Goals:**

- Rebuilding pagination as persisted TipTap nodes.
- Splitting long paragraphs, tables, or list items across printed pages with word-processor precision.
- Changing document generation, recipes, API responses, database schema, or PDF generation outside browser print.
- Changing Chrome print dialog settings such as destination, margins, headers, or background graphics.

## Decisions

1. **Scope screen spacer styles to screen media.**

   `createPaginationBoundaryCss` should emit spacer height and spacer margin rules under `@media screen`. Those rules are needed to align blocks with visual sheet frames in the app workspace, but they are harmful in print because the browser print engine already handles page boxes.

   Alternative considered: rely only on the global `@media print` stylesheet to override dynamic rules. That is fragile because the dynamic style tag has equal-or-higher specificity and later source order.

2. **Emit print reset rules from the same dynamic selector set.**

   For each generated boundary selector, the injected style should also include an `@media print` rule that removes the screen spacer (`height: 0`, `margin: 0`, or `margin-top: 0`) while preserving `break-before` or `break-after` as appropriate. Matching the same selector avoids specificity fights and makes the print behavior travel with the generated boundary.

   Alternative considered: remove `!important` from the dynamic screen rules. The screen layout relies on these rules winning over document typography margins, and weakening them could reintroduce visual drift between page frames and content.

3. **Reset print-only pagination container height.**

   Print CSS should explicitly reset the paginated ProseMirror body and content layer so `min-height`, `--document-pagination-total-height`, page frames, and workspace gaps do not create trailing blank pages or large empty regions.

   Alternative considered: only reset boundary elements. That fixes the most visible gap but can still leave extra printable height from the surface or ProseMirror minimum height.

4. **Keep browser print as best-effort but test the CSS contract.**

   Unit and component tests should assert that generated boundary CSS separates screen spacing from print breaks and that the preview print root exposes stable selectors. Full print-preview rendering varies by browser and OS, so manual browser verification remains part of the task list.

   Alternative considered: add a PDF pixel comparison test. That would be valuable later, but it is heavier than the current app test setup and not necessary to prevent the known CSS regression.

## Risks / Trade-offs

- **Browser print engines may still paginate differently from the screen preview** -> Preserve CSS page-break hints and document this as best-effort browser print behavior.
- **A block moved as a whole can still leave legitimate space at the bottom of the previous page** -> This change removes artificial spacer leakage; line-level block splitting remains out of scope.
- **Dynamic CSS can drift from global print CSS over time** -> Keep print-specific rules in the same generated style as the screen boundary selector and cover them with tests.
- **Manual `hr` page breaks and automatic before-block breaks use different placements** -> Generate print resets for both `self` and `before` boundary placements.
- **Existing tests may not simulate actual print layout** -> Assert the generated CSS contract in tests and add browser verification against the real preview route.

## Migration Plan

1. Update dynamic pagination CSS generation to emit separate `@media screen` and `@media print` rules for each boundary.
2. Extend global print CSS to reset the paginated ProseMirror content height and screen-only pagination surface dimensions.
3. Preserve existing selectors and data attributes used by the preview, editor, and tests.
4. Add focused tests for dynamic CSS and print-root behavior.
5. Verify a long completed preview in Chrome print preview or Save as PDF, using the affected ETP document as the reference case when available.

Rollback is straightforward: revert the CSS generation and print stylesheet changes. Saved document content is unaffected because no persisted document structure changes are introduced.

## Open Questions

- Should a future export flow generate server-side PDFs for deterministic pagination instead of relying on browser print?
- Should oversized tables and paragraphs get a later line/table-row splitting pass to reduce legitimate bottom-of-page whitespace?
