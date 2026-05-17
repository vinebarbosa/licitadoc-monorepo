## Context

The Tiptap editor route already supports editing, saving, conflict handling, preview navigation, and normalized document content. The remaining problem is experiential: the editable document is presented inside administrative dashboard chrome, with a visible sidebar, sticky header, metadata strip, toolbar, border, and card container all competing with the sheet.

This change keeps the current editing and persistence behavior but changes the presentation model. The editor route should behave like a focused document workspace inside the authenticated product, closer to Google Docs, Notion AI, or Craft than a CRUD detail page. The document remains institutional and export-compatible, but the surrounding UI becomes quieter and more editorial.

## Goals / Non-Goals

**Goals:**
- Make the document sheet the strongest visual object on the page.
- Reduce app shell, sidebar, metadata, and container weight around the editor.
- Present a minimal floating toolbar above the sheet instead of a toolbar embedded in a bordered card.
- Increase document scale, useful editing width, and whitespace while preserving A4 proportions.
- Keep Tiptap editing, keyboard save, save state, preview navigation, dirty-state protection, and content serialization unchanged.
- Scope typography and surface changes so preview/PDF/DOCX compatibility is preserved.

**Non-Goals:**
- No backend, database, document generation, API client, or save contract changes.
- No replacement of Tiptap or change to persisted `draftContent` format.
- No conversion of the editor into a read-only preview.
- No new marketing-style illustration, landing page, decorative gradient, or product-tour copy.
- No broad app shell redesign outside the document editor route.

## Decisions

1. Introduce a route-level document workspace mode for the edit route.

   The document editor should be allowed to reduce app-shell competition without affecting ordinary dashboard pages. The preferred approach is a small route-level or hook-driven shell mode that can collapse, hide, or visually minimize the sidebar and app header for `/app/documento/:documentId`, while preserving authenticated routing and a clear way back.

   Alternative considered: moving the editor outside the protected app shell. This would create duplicate auth/layout behavior and make navigation less consistent. A route-level focus mode keeps the editor in the product while letting it feel like a document workspace.

2. Separate document controls from administrative metadata.

   Save, preview, and back controls should remain immediately available, but metadata such as type, status, process, responsible, and updated date should move into a discreet compact strip or secondary popover/summary. The primary visual line should identify the document and save state without creating another dashboard card.

   Alternative considered: keeping the current metadata grid above the editor. It is functional, but it occupies too much attention and reinforces the CRUD-page feel.

3. Render the toolbar as a floating editor control surface.

   `DocumentTiptapEditor` should stop owning a card-like outer container. It should render a minimal toolbar above the page, grouped by action type, with small icon buttons, subtle dividers, accessible labels, active state, and disabled state. The toolbar can be sticky or floating within the workspace, but it should not look like a CMS toolbar inside a panel.

   Alternative considered: hiding most tools behind menus immediately. That reduces visual weight but can make core procurement editing slower. The first pass should keep core actions visible while making them smaller and quieter.

4. Use editor-specific document surface classes and tokens.

   The editor sheet should reuse institutional document semantics, but screen-editing surface styles should be isolated with editor-specific classes. That prevents visual polish for the edit workspace from accidentally changing print/PDF/preview output rules.

   Alternative considered: changing the shared institutional document tokens globally. That risks altering preview/export behavior, which is explicitly out of scope.

5. Prefer a single unframed workspace over nested cards.

   The page background should be a very light gray editorial canvas. The white A4-like sheet should sit directly on that canvas with a near-invisible border and extremely soft shadow. The editor should not be wrapped in a card that itself contains another sheet.

   Alternative considered: retaining a bordered editor component for perceived safety. Save state and conflict protection already provide safety; an extra card adds noise without improving trust.

## Risks / Trade-offs

- Sidebar minimization could reduce navigation discoverability -> Keep back, preview, save, and compact document context visible, and use a reversible shell mode rather than removing app navigation globally.
- Larger document scale can overflow on small screens -> Use responsive max-width, viewport-aware gutters, and horizontal overflow only when unavoidable for true document proportions.
- Floating toolbar can overlap content during scroll -> Reserve toolbar spacing above the sheet and use stable sticky offsets relative to the editor workspace.
- Editor-specific typography might drift from export typography -> Share semantic structure and only isolate screen presentation details that should not affect preview/PDF/DOCX output.
- Visual checks can be subjective -> Add focused Playwright coverage or screenshot review for desktop/mobile editor states in addition to existing behavior tests.
