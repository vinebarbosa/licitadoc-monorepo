## 1. Workspace Shell

- [x] 1.1 Review the current document edit route chrome, app shell header, sidebar behavior, editor wrapper, and CSS selectors that contribute to the dashboard/card feel.
- [x] 1.2 Add a route-level document focus mode for `/app/documento/:documentId` that minimizes or visually deemphasizes the app sidebar/header without changing authentication or protected routing.
- [x] 1.3 Keep back, preview, save, and save-status controls reachable inside the focused workspace after app-shell chrome is reduced.
- [x] 1.4 Update loading and non-editable document states so they remain coherent with the lighter editor workspace.

## 2. Document Page Composition

- [x] 2.1 Replace the current dashboard-style header and metadata grid with a compact document top bar focused on title, save state, and primary actions.
- [x] 2.2 Move document metadata into discreet secondary context, such as a compact line, subdued summary, or popover, without using a right-side card.
- [x] 2.3 Remove unnecessary editor containers so the sheet sits directly on a light workspace canvas rather than inside a heavy bordered card.
- [x] 2.4 Keep save error and conflict feedback visible without creating large persistent panels that compete with the document.

## 3. Floating Tiptap Toolbar

- [x] 3.1 Refactor `DocumentTiptapEditor` so the toolbar and document sheet are not presented as a single card component.
- [x] 3.2 Restyle the toolbar as a compact floating control surface above the sheet with grouped icon-first controls, subtle separators, and smaller visual weight.
- [x] 3.3 Preserve accessible labels, active state, disabled state, link prompt behavior, undo/redo, and all existing formatting commands.
- [x] 3.4 Ensure the toolbar remains usable on narrow viewports without overlapping the editable document.

## 4. Sheet And Typography

- [x] 4.1 Add editor-specific sheet styles for a larger white A4-style surface, generous padding, dynamic height, near-invisible border, and extremely soft shadow.
- [x] 4.2 Tune editor-only typography for improved heading hierarchy, vertical rhythm, paragraph line-height, lists, blockquotes, and administrative field readability.
- [x] 4.3 Ensure the focused editor styles do not alter preview, print, PDF, or DOCX output rules.
- [x] 4.4 Verify normalized generated content still opens with semantic headings, administrative fields, paragraphs, and lists inside the editable Tiptap surface.

## 5. Tests And Verification

- [x] 5.1 Update React tests for the new focused editor workspace, compact metadata, primary actions, and toolbar accessibility.
- [x] 5.2 Update or add Playwright coverage for opening the focused editor, editing content, saving, and previewing saved content.
- [x] 5.3 Run focused document editor unit tests and `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.4 Run focused Playwright coverage for the document editor route and capture/review a desktop screenshot for visual sanity.
- [x] 5.5 Run `pnpm --filter @licitadoc/web lint` or record any pre-existing unrelated lint blockers.
