## Context

The automatic pagination layer currently separates page-frame rendering from content-flow displacement. The surface can render additional visual sheets using `scrollHeight`, while the measured pagination plan may still contain no automatic boundary for the overflowing block. That produces the observed failure: pagination appears to exist, but text continues in the same flow instead of jumping to the next page.

The editor and preview must remain one canonical TipTap document. Automatic boundaries are derived presentation state and must not be persisted into TipTap JSON.

## Goals / Non-Goals

**Goals:**

- Make page count, page frames, and content displacement come from one measured pagination plan.
- Move the first overflowing top-level block to the next page by applying a non-persisted visual spacer before it.
- Detect overflow from rendered block positions relative to the page usable area.
- Keep manual page breaks as forced boundaries in the same plan.
- Preserve selection, editing, AI replacement, save payloads, and preview rendering behavior.

**Non-Goals:**

- Splitting a single paragraph, table, or oversized block across pages line-by-line.
- Persisting automatic page boundaries into `draftContentJson`.
- Changing document generation, API contracts, database schema, or the validated editor UI.
- Matching Word or Google Docs pagination with document-engine precision.

## Decisions

1. **Use measured block positions for overflow detection.**

   The pagination layer should measure each top-level content block relative to the ProseMirror content origin and compare its rendered `top` and `bottom` to the current page's usable bottom. When a block's bottom exceeds the usable bottom and the block can fit on a new page, the plan creates an automatic boundary before that block.

   Alternative considered: continue accumulating estimated block heights. That is more unit-test friendly but misses real layout effects from margins, list spacing, headings, fonts, marks, and browser wrapping.

2. **Make boundaries produce the page count, not the other way around.**

   The surface should avoid rendering extra pages solely because `scrollHeight` is large when no matching boundary exists. A page frame without a corresponding displacement boundary creates a visually paginated background with unpaginated content.

   Alternative considered: keep the `scrollHeight` fallback as a safety net. It hides missing-boundary bugs and creates the exact mismatch users are seeing.

3. **Apply spacer from the measured block top to the next page content start.**

   For an automatic boundary, the spacer should be computed as the distance between the overflowing block's current rendered top and the next page's content start. The spacer is applied as transient DOM/CSS state on the block, not saved as document content.

   Alternative considered: use remaining page height plus page gap from an accumulated counter. That can drift when margins and real rendered positions do not match the counter.

4. **Keep manual page breaks in the same planning path.**

   Existing manual break nodes should force the following content to the next page using the same page geometry. Manual breaks may use a self spacer, while automatic breaks use a before-block spacer.

   Alternative considered: handle manual page breaks through separate CSS. Separate handling makes it easier for manual and automatic boundaries to disagree visually.

5. **Verify through DOM-visible boundary state and browser layout.**

   Tests should assert that long content creates automatic boundaries and that the page count is not increased without boundary state. Browser verification should check that overflowing content begins within the next page frame, not merely that multiple page frames exist.

## Risks / Trade-offs

- **Measurement can oscillate after spacers are applied** -> Clear pagination state before measuring and schedule a follow-up measurement after applying boundaries.
- **Oversized blocks cannot fit on one page** -> Allow the oversized block to overflow that page and prevent infinite boundary loops.
- **DOM measurement differs between editor and preview** -> Reuse the same pagination surface and constants in both contexts.
- **Removing the `scrollHeight` fallback may under-render pages during a transient measurement** -> Use scheduled catch-up measurements and rely on the plan to produce page frames once layout is stable.
- **Margins can collapse or behave differently across block types** -> Prefer actual top/bottom positions and test headings, paragraphs, and lists.

## Migration Plan

1. Update the pagination metrics to include rendered `top` and `bottom` values for top-level blocks.
2. Update the planner to create automatic boundaries by measured overflow position.
3. Make the rendered page count come from the boundary plan, with no page-only fallback that lacks content displacement.
4. Keep manual break support and oversized-block protection.
5. Update editor and preview tests to cover visual-flow displacement.
6. Verify `/demo/documento/editor`, protected editor, and JSON preview in the browser with long content.

Rollback is straightforward: disable the automatic pagination layer or restore the prior planner behavior. Saved document JSON is unaffected because generated automatic boundaries are never persisted.

## Open Questions

- Should the first overflowing block always move as a whole, even when that leaves substantial empty space at the bottom of the previous page?
- Should future work split long paragraphs by line boxes once top-level block pagination is stable?
