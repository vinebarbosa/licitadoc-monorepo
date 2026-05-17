## 1. API Editing Contract

- [x] 1.1 Add document draft update request and response schemas for `PATCH /api/documents/:documentId`, including `draftContent` and `sourceContentHash`.
- [x] 1.2 Implement a document draft update service that loads the document, enforces actor organization scope, requires `completed` status, validates the source content hash, updates `draftContent` and `updatedAt`, and returns document detail.
- [x] 1.3 Register the `PATCH /api/documents/:documentId` route in the documents routes module.
- [x] 1.4 Add API tests for successful save, cross-organization rejection, non-completed document rejection, stale hash conflict, unchanged ownership fields, and returned updated detail.

## 2. Generated Client And Dependencies

- [x] 2.1 Regenerate `@licitadoc/api-client` after the API route schema is available.
- [x] 2.2 Add the required Tiptap packages to `apps/web/package.json` and update the workspace lockfile.
- [x] 2.3 Add any Markdown conversion helper dependency only if the selected Tiptap Markdown path requires it.
- [x] 2.4 Add a documents API adapter hook for saving draft edits and updating the document-detail query cache.

## 3. Editor Content Model

- [x] 3.1 Add a document editor content adapter that converts persisted `draftContent` into Tiptap editor content.
- [x] 3.2 Add serialization from Tiptap editor content back to the canonical persisted `draftContent` format.
- [x] 3.3 Add unit tests covering headings, paragraphs, emphasis, links, bullet lists, numbered lists, blockquotes, and empty content handling.
- [x] 3.4 Add source content hash handling on the web side so save requests use the hash of the loaded persisted content.

## 4. Tiptap Editor UI

- [x] 4.1 Implement a reusable documents-module Tiptap editor component with heading, paragraph, bold, italic, underline, bullet list, numbered list, blockquote, link, undo, and redo controls.
- [x] 4.2 Implement active toolbar state, disabled states, accessible labels, and icon-based controls using existing shared UI primitives and lucide icons.
- [x] 4.3 Style the editor canvas with the existing institutional document visual language while keeping the page restrained, mature, and free of decorative template patterns.
- [x] 4.4 Add keyboard save support for `Ctrl/Cmd+S`.

## 5. Document Edit Page Experience

- [x] 5.1 Create and export `DocumentEditPage` from the documents module.
- [x] 5.2 Register `/app/documento/:documentId` in `apps/web/src/app/router.tsx` under the protected app shell with edit-document breadcrumbs.
- [x] 5.3 Build the editor page command bar with back, preview, save, save status, and document metadata context.
- [x] 5.4 Add loading, retryable error, not found or forbidden, generating, failed, and empty-content states.
- [x] 5.5 Add dirty-state tracking, successful-save feedback, retryable-save error feedback, stale-content conflict feedback, and before-unload protection for unsaved edits.
- [x] 5.6 Update document listing, process detail, and app home entry points so edit actions route to `/app/documento/:documentId` and preview actions continue to route to `/preview`.

## 6. Frontend Tests

- [x] 6.1 Add React tests for loading a completed document into the editor with metadata and initial content.
- [x] 6.2 Add React tests for formatting controls, dirty state, keyboard save, save success, save error, and stale-content conflict.
- [x] 6.3 Add React tests for non-editable states: generating, failed, empty content, not found, forbidden, and retryable detail error.
- [x] 6.4 Add routing and link tests proving edit links use `/app/documento/:documentId` while preview links still use `/app/documento/:documentId/preview`.
- [x] 6.5 Add or update Playwright coverage for an authenticated user opening the editor, making a small edit, saving, and seeing the saved content in preview.

## 7. Verification

- [x] 7.1 Run the relevant API document tests.
- [x] 7.2 Run `pnpm --filter @licitadoc/api-client generate`.
- [x] 7.3 Run the relevant documents-module web tests.
- [x] 7.4 Run `pnpm --filter @licitadoc/web typecheck`.
- [ ] 7.5 Run `pnpm --filter @licitadoc/web lint`.
- [x] 7.6 Run the focused document editor Playwright/e2e coverage.
- [x] 7.7 Run `openspec status --change "add-document-tiptap-editor-page"` and confirm the change is apply-ready.
