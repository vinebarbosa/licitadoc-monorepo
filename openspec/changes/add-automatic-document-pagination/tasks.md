## 1. Audit Current Document Surface

- [ ] 1.1 Confirm the active TipTap renderer used by `/demo/documento/editor`, `/app/documento/:documentId`, and `/app/documento/:documentId/preview`.
- [ ] 1.2 Map the current page sizing tokens, sheet padding, zoom behavior, ruler behavior, and preview sheet styles.
- [ ] 1.3 Identify current manual page-break representations and where `horizontalRule` is inserted, rendered, printed, or tested.
- [ ] 1.4 Identify selection, AI prompt, text-adjustment, undo/redo, and save flows that must not be disturbed by pagination widgets.

## 2. Pagination Model and Measurement

- [ ] 2.1 Define shared page geometry constants for sheet width, usable height, page margins, page gap, and zoom-adjusted dimensions.
- [ ] 2.2 Implement a pure pagination planning utility that accepts measured block metrics and returns page boundaries, page offsets, filler heights, and page count.
- [ ] 2.3 Add handling for forced manual page breaks so they start a new page while automatic boundaries continue around them.
- [ ] 2.4 Add oversized-block handling so a block taller than one page remains usable without infinite pagination loops.
- [ ] 2.5 Add unit tests for page planning, manual breaks, boundary movement after content removal, and oversized blocks.

## 3. TipTap Pagination Layer

- [ ] 3.1 Implement a shared TipTap pagination plugin/extension that measures rendered top-level blocks outside its own decoration widgets.
- [ ] 3.2 Schedule recalculation from ProseMirror updates, `ResizeObserver`, font readiness, zoom changes, and container width changes.
- [ ] 3.3 Render automatic page-boundary widgets as non-editable/non-selectable decorations that do not enter saved JSON.
- [ ] 3.4 Expose pagination layout data to render page frames behind the editor/preview content.
- [ ] 3.5 Ensure pagination decorations do not break cursor movement, cross-page text selection, tab indentation, or keyboard shortcuts.

## 4. Visual Page Surface

- [ ] 4.1 Replace the single connected sheet illusion with a paginated document surface that renders independent page frames.
- [ ] 4.2 Align ProseMirror content with page frames so the first block on each computed page starts inside the page usable area.
- [ ] 4.3 Make page gaps use the workspace background and give each page its own border and shadow.
- [ ] 4.4 Keep the ruler aligned with the usable page width while pages are paginated.
- [ ] 4.5 Preserve mobile/responsive constraints without horizontal overflow.

## 5. Integrations

- [ ] 5.1 Integrate automatic pagination into the public demo editor with long mock content.
- [ ] 5.2 Integrate the same pagination layer into the protected document editor without changing save payloads.
- [ ] 5.3 Integrate the same pagination layer into the completed JSON preview renderer.
- [ ] 5.4 Preserve legacy Markdown preview behavior for documents without `draftContentJson`.
- [ ] 5.5 Keep manual `horizontalRule` page breaks compatible as forced page boundaries.
- [ ] 5.6 Ensure AI selection, suggestion preview, accept/reject, and preview text-adjustment overlays remain positioned correctly across pages.

## 6. Print Behavior

- [ ] 6.1 Map automatic page-boundary widgets to print page breaks where browser print supports them.
- [ ] 6.2 Hide screen-only page frames, shadows, rulers, toolbars, and workspace gaps from printed content.
- [ ] 6.3 Preserve manual forced page breaks in print output.

## 7. Verification

- [ ] 7.1 Add page/component tests proving long TipTap JSON renders multiple automatic pages in editor and preview.
- [ ] 7.2 Add tests proving automatic boundaries are not persisted in `draftContentJson` after save.
- [ ] 7.3 Add tests for manual break compatibility with automatic pagination.
- [ ] 7.4 Add tests for editing near a page boundary and for AI replacement near a page boundary.
- [ ] 7.5 Run focused web tests, typecheck, and formatting/lint checks for touched files.
- [ ] 7.6 Verify in the browser that long content paginates automatically in `/demo/documento/editor`.
- [ ] 7.7 Verify in an authenticated browser session that `/app/documento/:documentId` and `/app/documento/:documentId/preview` paginate at matching content positions.
- [ ] 7.8 Verify browser print preview behavior for an automatically paginated completed preview.
