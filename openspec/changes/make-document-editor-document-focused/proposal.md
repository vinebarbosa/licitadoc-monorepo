## Why

The current document editor still reads as a CRUD dashboard panel that happens to contain editable content. LicitaDoc needs the editing route to feel like opening a real institutional document: calm, focused, spacious, and trustworthy, with administrative chrome receding behind the document itself.

## What Changes

- Rework the document edit route into a document-first workspace where the A4 sheet is the visual center of the screen.
- Reduce dashboard weight by softening or removing card containers, heavy borders, competing sidebars, and high-contrast administrative elements around the editor.
- Replace the current embedded toolbar treatment with a minimal floating document toolbar positioned above the page, using smaller icon-first controls and clear action grouping.
- Increase document scale, whitespace, and useful editing width while keeping the sheet visually proportional to an official document.
- Make metadata and save/navigation context discreet and supportive rather than visually dominant.
- Refine editor typography, spacing, hierarchy, and document surface styling so the editable Tiptap content feels like a premium institutional document, not a CMS text area.
- Preserve the current Tiptap editing model, save flow, route behavior, preview/export compatibility, and backend contract.

## Capabilities

### New Capabilities
- `document-focused-editor-workspace`: Covers the document-first visual/editorial experience for the Tiptap edit route, including workspace layout, floating toolbar, A4 sheet presentation, metadata discretion, and visual focus requirements.

### Modified Capabilities
- None.

## Impact

- Web app: document editor page layout, Tiptap toolbar presentation, institutional editor sheet CSS, document editor tests, and focused visual/e2e coverage.
- Shared styles: adjustments to editor-only institutional document surface and typography rules without changing backend persistence or generated document semantics.
- No API, database, generation, or document update contract changes.
- No new required dependencies unless an existing shared UI primitive is insufficient for the floating toolbar/menu behavior.
