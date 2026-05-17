## 1. Inspect Current Pagination Behavior

- [x] 1.1 Confirm the current automatic pagination path in the shared document pagination surface.
- [x] 1.2 Confirm where page frames are rendered from layout state in the demo editor and JSON preview.
- [x] 1.3 Reproduce the mismatch where multiple page frames render without overflowing text moving to the next page.

## 2. Update Pagination Metrics and Planning

- [x] 2.1 Extend measured block metrics to include rendered top and bottom positions.
- [x] 2.2 Update automatic overflow detection to compare measured block positions against the usable page boundary.
- [x] 2.3 Compute automatic spacer height from the overflowing block top to the next page content start.
- [x] 2.4 Preserve manual page break behavior inside the same layout plan.
- [x] 2.5 Keep oversized block handling from creating infinite pagination loops.

## 3. Align Page Frames With Flow Boundaries

- [x] 3.1 Remove or replace the page-count fallback that renders pages from scroll height without matching boundaries.
- [x] 3.2 Ensure page frame count comes from the measured pagination plan.
- [x] 3.3 Ensure automatic boundary attributes and CSS variables are applied before overflowing blocks.
- [x] 3.4 Ensure the surface clears old boundary state before each measurement.

## 4. Integrate Editor and Preview

- [x] 4.1 Verify the public demo editor uses the corrected pagination plan.
- [x] 4.2 Verify the protected document editor uses the corrected pagination plan.
- [x] 4.3 Verify the completed JSON preview uses the corrected pagination plan.
- [x] 4.4 Confirm saved TipTap JSON does not include generated automatic page-break nodes.

## 5. Tests and Verification

- [x] 5.1 Add or update unit tests for measured overflow boundaries and spacer calculation.
- [x] 5.2 Add or update tests proving page count does not grow without content displacement boundaries.
- [x] 5.3 Add or update tests for manual page breaks alongside automatic overflow.
- [x] 5.4 Run focused web tests for document pagination, editor, and preview.
- [x] 5.5 Run typecheck and formatting/lint checks for touched files.
- [ ] 5.6 Verify in the browser that `/demo/documento/editor` shows overflowing content starting inside the next page.
- [ ] 5.7 Verify in the browser that completed JSON preview matches the editor's page boundaries for the same content.
