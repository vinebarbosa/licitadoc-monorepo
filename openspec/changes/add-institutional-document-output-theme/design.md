## Context

The web document preview already renders generated Markdown inside an A4-like page surface and has scoped print styles. However, the layout is still implemented directly in preview and Markdown components. The next step is to turn the visual rules into a reusable institutional output theme so the same typography, spacing, page margins, field layout, list behavior, signature layout, and pagination rules apply consistently to DFD, ETP, TR, and Minuta.

The requested standard intentionally excludes logos, coat of arms, watermarks, decorative bands, and other graphic branding. This keeps the first institutional version focused on official-document readability and makes future branding safer to add as optional layers.

## Goals / Non-Goals

**Goals:**

- Define a reusable institutional document theme for generated document HTML and print/PDF-ready output.
- Apply exact page, typography, spacing, list, administrative-field, signature, and pagination rules from the proposal.
- Keep the theme shared across all supported generated document types.
- Separate structural rendering concerns from typography tokens, pagination rules, and global print styles.
- Preserve safe Markdown behavior and live-generation preview behavior.
- Leave clear extension points for future organization branding.

**Non-Goals:**

- Adding logos, coat of arms, watermarks, decorative bands, graphic elements, or organization colors.
- Changing generation recipes or the generated Markdown text.
- Implementing a new backend PDF service.
- Adding a full WYSIWYG editor or document-layout engine.
- Guaranteeing perfect print pagination in every browser beyond the CSS controls browsers expose.

## Decisions

1. **Create a dedicated institutional document theme boundary**

   Add a document-rendering theme module under the documents frontend module that owns reusable tokens and class composition for page layout, typography, sections, lists, administrative fields, signature blocks, and print selectors. `DocumentPreviewPage` and `DocumentMarkdownPreview` should consume this boundary instead of hardcoding institutional values in multiple files.

   Alternative considered: keep all values in `styles.css`. That would make print simple, but it would blur structure, typography, and runtime rendering concerns and make future per-organization customization harder.

2. **Use CSS variables for institutional tokens**

   Expose A4, margin, typography, spacing, and pagination tokens through scoped CSS custom properties on the institutional document root. This keeps HTML preview, print styles, and future PDF export routes aligned without requiring every component to repeat literal values.

   Alternative considered: use only Tailwind utility classes. Tailwind works well for app UI, but exact print-oriented values like 12pt, 100px page margin, widow/orphan rules, and future organization overrides are easier to maintain through scoped CSS.

3. **Keep generated Markdown as the content source for this scope**

   The renderer will continue consuming stored/generated Markdown and map Markdown elements into institutional structure. This avoids backend changes and preserves the existing streaming/preview pipeline. Administrative fields, lists, section headings, and signatures should be styled through Markdown patterns already used by the recipes, with small renderer helpers where needed.

   Alternative considered: introduce a new structured JSON document schema before styling. That would improve semantic control but is too large for this visual pass and would require recipe and API changes.

4. **Scope print/PDF-ready behavior to the document output root**

   Print CSS should target the institutional document output root and not the whole app globally. Browser printing and future client/server PDF rendering should share the same root selectors, page margins, typography, and break rules.

   Alternative considered: create a separate print-only route immediately. That can come later if true PDF export needs a dedicated renderer; the immediate change can keep the current preview route as the canonical output surface.

5. **Build for branding later without rendering branding now**

   The theme should reserve clean extension points for future logos, watermarks, footers, institutional bands, and organization colors, but must not render any of those elements in this change.

   Alternative considered: include invisible placeholders in the DOM. That risks layout surprises and makes tests brittle. Named theme slots/types are enough for future work.

## Risks / Trade-offs

- **Markdown lacks explicit semantics for every administrative field or signature block** -> Use consistent Markdown rendering patterns now and keep the theme boundary ready for a future structured document schema.
- **CSS pagination support differs by browser** -> Apply `break-*`, `page-break-*`, `orphans`, `widows`, and print margins while documenting that browser print engines still control final pagination.
- **Exact pixel margins reduce responsive flexibility on narrow screens** -> Use exact margins for print/PDF and a scaled/responsive equivalent for screen preview so mobile review remains usable.
- **Times New Roman can look different across operating systems** -> Use the requested fallback stack: Times New Roman, Liberation Serif, serif.
- **Future true PDF export may need a separate renderer** -> Keep selectors and tokens reusable so a later PDF route or service can consume the same institutional contract.
