## Context

The current document editor and completed preview render TipTap JSON in a single continuous document surface. Page breaks only appear when the JSON contains a manual `horizontalRule` marker, styled as a page gap. This is not enough for formal document editing: when content exceeds the usable height of a page, users expect the next block to continue on a new visible sheet automatically.

Automatic pagination is harder than styling an `<hr>`. The system must measure rendered content after fonts, layout, zoom, margins, lists, inline marks, and responsive width are applied. The result should be a visual pagination layer derived from the current document, while the saved TipTap JSON remains a single canonical document.

## Goals / Non-Goals

**Goals:**

- Paginate editor and JSON preview automatically when rendered content exceeds the usable page height.
- Keep a single editable TipTap document so selection, undo/redo, keyboard shortcuts, AI text changes, and saving remain stable.
- Render pages as distinct sheets with background space and page shadows between them.
- Recalculate pagination when content, viewport width, zoom, fonts, page dimensions, or manual breaks change.
- Preserve persisted manual page breaks as forced page boundaries while deriving automatic page boundaries from measurement.
- Keep automatic pagination out of saved JSON unless a user explicitly inserts a manual page break.
- Support print by mapping computed page boundaries to browser page breaks where possible.

**Non-Goals:**

- Exact DOCX/PDF-grade pagination parity with Word or Google Docs.
- Splitting paragraphs line-by-line in the first implementation.
- Persisting generated automatic page boundaries into the database.
- Rebuilding the validated editor toolbar or AI interaction model.
- Changing document generation prompts or API semantics.

## Decisions

1. **Keep one TipTap editor and add a pagination plugin/layer.**

   The editor should remain a single ProseMirror document. Pagination will be represented by non-persisted decorations and a page-frame layer, not by splitting content into separate editor instances. This keeps transactions, selection ranges, marks, AI replacements, undo/redo, and JSON saves aligned with the current implementation.

   Alternative considered: render one editor per page. That would make pages visually easy but creates hard problems around selections crossing pages, undo history, block movement, collaboration later, and JSON serialization.

2. **Measure top-level rendered blocks and insert derived page gaps before overflowing blocks.**

   A pagination controller should measure rendered block rectangles relative to the document body. It should accumulate block heights against the usable page height and create an automatic boundary before the first block that would overflow the current page. Manual page-break nodes should force a boundary. For the first implementation, top-level blocks are the unit of pagination; oversized blocks may overflow a page rather than being split internally.

   Alternative considered: split individual paragraphs by line measurement. That offers more precise pagination but is much more fragile in ProseMirror because edits, marks, and browser line wrapping can shift text positions constantly.

3. **Render page chrome separately from content.**

   The document body should expose a computed layout model: page count, page top offsets, usable content area, automatic boundary widgets, and manual boundary widgets. A background/page-frame layer should render individual sheet frames behind the content so each page has its own white surface, border, and shadow. The ProseMirror content stays in one flow aligned to those frames.

   Alternative considered: keep a single white sheet and insert large gaps. That is what currently makes pages feel visually connected and does not satisfy the expected page model.

4. **Pagination is derived and volatile.**

   Automatic page boundaries should not be stored in `draftContentJson`. They should be recalculated from content and layout. Persisted manual page breaks can remain in JSON, either as the existing `horizontalRule` compatibility representation or a future dedicated `pageBreak` node, but automatic boundaries stay presentation-only.

   Alternative considered: save page-break nodes after measuring. That would make the JSON dependent on viewport, zoom, fonts, and browser rendering, causing stale page breaks after any visual change.

5. **Use shared pagination in editor and preview.**

   The protected editor, public demo, and read-only preview should use the same pagination controller and page-surface constants. The preview should be read-only but measured the same way so saved documents look materially identical between edit and preview modes.

6. **Schedule measurement defensively.**

   Recalculation should be debounced through `requestAnimationFrame`, triggered by ProseMirror updates, `ResizeObserver`, font readiness, zoom changes, and relevant container size changes. The controller should avoid infinite loops by measuring from stable content nodes and ignoring its own decoration widgets.

## Risks / Trade-offs

- **Layout measurement is browser-dependent** -> Keep requirements focused on visual consistency within the app, not exact external word-processor parity.
- **Frequent recalculation can feel slow on long documents** -> Debounce measurements, measure top-level blocks first, and avoid persisting automatic boundaries.
- **Decoration widgets can disturb measurement** -> Mark pagination widgets as ignored by measurement and compute from content nodes only.
- **Large tables, lists, or paragraphs may exceed a page** -> Allow oversized blocks to overflow one page in the first version and identify finer splitting as a future enhancement.
- **Selection near page boundaries may be awkward** -> Keep one ProseMirror document and make pagination widgets non-editable/non-selectable.
- **Print output may still vary by browser** -> Use computed boundary widgets with print CSS while keeping browser print behavior as best-effort.

## Migration Plan

1. Introduce a shared pagination model and measurement utilities without changing saved document JSON.
2. Integrate the pagination layer into the public demo editor first to validate the visual behavior.
3. Reuse the same layer in the protected editor and JSON preview.
4. Preserve existing manual `horizontalRule` page-break rendering as forced page boundaries.
5. Add tests for the pagination algorithm and browser checks for long documents.
6. Roll back by disabling the pagination plugin/layer; stored content remains unchanged because automatic boundaries are not persisted.

## Open Questions

- Should the first implementation expose a visible page number or keep page count implicit?
- Should manual page breaks keep using `horizontalRule` or should this change introduce a dedicated `pageBreak` TipTap node?
- What is the acceptable behavior for a single paragraph or table taller than one page in the first release?
