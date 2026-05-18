## 1. Confirm Current Print Failure

- [x] 1.1 Reproduce the affected completed document preview in the browser and confirm the print preview shows excessive blank space or an inflated page count.
- [x] 1.2 Inspect the generated pagination boundary `<style>` tag and confirm automatic/manual spacer rules apply outside screen-only media.
- [x] 1.3 Confirm the global `@media print` rules currently hide page frames but can lose to dynamically injected boundary spacing.

## 2. Make Dynamic Pagination CSS Print-Aware

- [x] 2.1 Update `createPaginationBoundaryCss` so automatic before-block spacer margins are emitted only for screen rendering.
- [x] 2.2 Update `createPaginationBoundaryCss` so manual `self` spacer heights are emitted only for screen rendering.
- [x] 2.3 Add generated print reset rules for automatic boundaries that preserve `break-before` while forcing spacer margin to zero.
- [x] 2.4 Add generated print reset rules for manual boundaries that preserve `break-after` while forcing spacer height and margin to zero.
- [x] 2.5 Preserve existing selector generation, data attributes, page count attributes, and screen pagination behavior.

## 3. Tighten Global Print Styles

- [x] 3.1 Reset paginated ProseMirror `min-height` and related content-layer sizing in `apps/web/src/styles.css` under `@media print`.
- [x] 3.2 Ensure pagination page frames, shadows, workspace padding, preview actions, live status, and planning UI remain hidden from printed output.
- [x] 3.3 Ensure manual `hr` page breaks in the paginated preview print as page breaks with zero visual height.
- [x] 3.4 Confirm the print CSS remains scoped to the document preview print root and does not affect normal app screens.

## 4. Tests

- [x] 4.1 Add or update a pagination-surface test proving generated boundary CSS separates `@media screen` spacer rules from `@media print` reset rules.
- [x] 4.2 Add or update preview tests proving long TipTap JSON preview content still renders automatic pagination frames on screen.
- [x] 4.3 Add or update assertions that print-root selectors and print-only hidden elements remain available for the stylesheet.
- [x] 4.4 Add regression coverage for manual page-break boundaries so their print reset does not remove the page-break hint.

## 5. Verification

- [x] 5.1 Run focused document pagination and preview tests.
- [x] 5.2 Run the web typecheck or the repo's focused frontend validation command for touched files.
- [x] 5.3 Open a long completed preview in the browser and confirm screen pagination still shows distinct sheets.
- [x] 5.4 Use browser print preview or Save as PDF for the affected ETP preview and confirm pages no longer contain large artificial blank regions between sheets.
- [x] 5.5 Compare the resulting print preview page count against the expected content length and record any remaining legitimate whitespace caused by whole-block pagination.
