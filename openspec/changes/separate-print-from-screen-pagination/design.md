## Context

The prior print whitespace fix removed dynamic spacer height from print, but automatic screen pagination still maps to physical page breaks. The current preview generates `break-before: page` for boundaries created from screen measurements, both in `createPaginationBoundaryCss` and in static print CSS for `[data-document-pagination-break-before="true"]`. That makes browser print treat a screen-only visual page boundary as a real PDF page boundary.

The attached PDF shows the failure mode: a page can contain only the end of one topic while the next normal paragraph starts on the following page, leaving a large blank area. The pagination model already distinguishes `reason: "automatic"` from `reason: "manual"` and uses `placement: "before"` for automatic boundaries and `placement: "self"` for manual page-break elements.

## Goals / Non-Goals

**Goals:**

- Keep the screen preview's paginated sheet layout unchanged.
- Let print/PDF layout flow naturally across automatic screen pagination boundaries.
- Preserve manual page breaks as real printed page breaks.
- Keep print spacer resets so visual pagination gaps do not leak into the PDF.
- Add tests that protect both automatic and manual boundary behavior.

**Non-Goals:**

- Build a custom line-by-line PDF pagination engine.
- Make browser print output match every screen preview page boundary exactly.
- Change document generation content or editing semantics.
- Replace the browser print/PDF pipeline.

## Decisions

### Treat automatic boundaries as screen-only in print

Automatic boundaries are produced from measured screen geometry and are useful for placing content inside visual preview sheets. They are not a stable contract for the browser's physical print layout because print uses its own page box, font metrics, and fragmentation rules.

Implementation direction: keep the current `@media screen` rules that add `margin-top` and `break-before` for automatic boundaries, but change the `@media print` rules for those same boundaries to reset spacing and avoid forced page breaks. This means `break-before` / `page-break-before` must be `auto`, unset, or otherwise not forced for automatic boundaries in print.

Alternative considered: keep all automatic `break-before` hints and only reduce margins. This preserves closer visual parity with the screen preview, but it is the direct cause of the sparse printed pages.

### Preserve manual page breaks as print page breaks

Manual page breaks represent explicit document intent. The manual boundary path uses a `self` placement and should continue to emit `break-after: page` / `page-break-after: always` in print, with the visual spacer height reset to zero.

Alternative considered: let all boundaries flow in print. That would fix blank pages but would break documents where the user or document template intentionally inserted a page break.

### Keep static and dynamic print CSS aligned

The dynamic CSS generated per boundary and the global `styles.css` print selectors both influence final print output. The change must update both layers so a static selector does not reintroduce `break-before: page` after dynamic CSS has removed it.

Implementation direction: dynamic CSS should use boundary metadata to decide print behavior. Static CSS should provide safe defaults for print reset only, not globally force page breaks on `[data-document-pagination-break-before="true"]`.

### Verify with real browser PDF output

Unit tests can prove the generated CSS contract, but this bug appears in Chrome's print/PDF layout. Verification should include the running app on `localhost:5173` and a generated PDF/text-position check or equivalent visual check that automatic boundaries no longer create mostly blank pages.

## Risks / Trade-offs

- Screen and printed page boundaries may diverge more often -> Accept this because print/PDF uses the browser's physical page fragmentation; the screen preview remains a visual editing aid.
- Browser fragmentation can still split long paragraphs differently across platforms -> Keep the requirement limited to not forcing automatic screen boundaries, and verify with Chrome PDF output used by the app.
- Manual page breaks could regress while removing automatic breaks -> Add tests that prove manual `self` boundaries still force print page breaks.
- Existing CSS specificity can override the intended print behavior -> Update both dynamic boundary CSS and global print selectors, then verify computed print CSS or generated PDF behavior.
