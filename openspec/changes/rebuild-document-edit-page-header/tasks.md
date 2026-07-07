## 1. Editor Ownership

- [x] 1.1 Audit `apps/web/src/modules/documents/ui/document-edit-page.tsx` and `apps/web/src/modules/public/pages/document-editor-demo-page.tsx` to identify demo-only UI currently leaking into the production edit route.
- [x] 1.2 Define a documents-module production editor component API that accepts Tiptap JSON content, emits JSON changes, exposes the active editor to header controls, and supports the existing save shortcut.
- [x] 1.3 Ensure the production document edit route no longer imports or renders `DocumentAgentEditorExperience`.

## 2. Focused Page And Header

- [x] 2.1 Implement the focused document editing surface inside `apps/web/src/modules/documents` using the existing Tiptap JSON extensions and document sheet/pagination styling.
- [x] 2.2 Implement a persistent page header with back, preview, save, and save-status controls wired to the current page behavior.
- [x] 2.3 Implement formatting controls for paragraph/heading styles, undo, redo, bold, italic, underline, strikethrough, highlight, bulleted list, numbered list, and text alignment.
- [x] 2.4 Add accessible labels, tooltips, active states, disabled states, and responsive wrapping or overflow so the header remains usable on desktop and mobile widths.
- [x] 2.5 Remove unrelated edit-page surfaces such as assistant prompts, AI suggestion controls, demo context panels, and non-editing decorations.

## 3. Document Edit Integration

- [x] 3.1 Preserve document detail loading, not-found/forbidden, generating, failed, and empty-content states.
- [x] 3.2 Preserve dirty-state tracking by comparing current editor JSON with the last saved editor JSON.
- [x] 3.3 Preserve saving through the existing document save hook with `draftContentJson` and `sourceContentHash`.
- [x] 3.4 Preserve conflict/error feedback, successful-save baseline updates, beforeunload protection, and dirty-navigation confirmation for back and preview actions.

## 4. Tests And Validation

- [x] 4.1 Update `apps/web/src/modules/documents/pages/document-edit-page.test.tsx` to assert the focused workspace, formatting header, save state, preview link, and absence of demo/assistant UI.
- [x] 4.2 Add component coverage showing at least one formatting command changes editor content or state and enables save.
- [x] 4.3 Update relevant Playwright document-edit expectations in `apps/web/e2e/documents.spec.ts`.
- [x] 4.4 Run the targeted web test suite for document editing and fix regressions.
- [x] 4.5 Verify the document edit route in the browser at desktop and mobile widths for header usability and content overlap.
