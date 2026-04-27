## 1. Data And Model Setup

- [x] 1.1 Add a documents-module detail adapter that wraps the generated `GET /api/documents/:documentId` hook and keeps generated client names out of UI components.
- [x] 1.2 Add or extend documents model helpers for preview breadcrumbs, status display, process links, updated-at formatting, responsible labels, and safe draft-content presentation.
- [x] 1.3 Add MSW fixture data for document detail responses, including completed content, generating, failed, empty-content, and unavailable cases.
- [x] 1.4 Confirm the generated API client already matches the document-detail schema and regenerate `@licitadoc/api-client` only if the contract is stale.

## 2. Route And Module Wiring

- [x] 2.1 Create the `DocumentPreviewPage` page entrypoint and export it from the documents module public surface.
- [x] 2.2 Register `/app/documento/:documentId/preview` in `apps/web/src/app/router.tsx` under the protected app shell with appropriate breadcrumbs.
- [x] 2.3 Verify existing "Visualizar" links from the documents listing and process-detail document cards route to the new preview page when a document id is available.

## 3. Preview Page Experience

- [x] 3.1 Implement the preview page loading state with stable layout and skeletons/placeholders for metadata and document content.
- [x] 3.2 Render successful document metadata: name, type, status, process reference/link, responsibles, and updated timestamp.
- [x] 3.3 Render completed `draftContent` in a read-only document preview surface that preserves readable line breaks without executing stored HTML.
- [x] 3.4 Implement persistent states for generating documents, failed generation, completed documents without content, forbidden/not found responses, and retryable API errors.
- [x] 3.5 Provide clear navigation back to `/app/documentos` and to the related process when `processId` is available.

## 4. Frontend Tests

- [x] 4.1 Add React tests for a completed document preview showing metadata, process navigation, and stored content.
- [x] 4.2 Add React tests for loading, retryable error with retry action, forbidden/not found, generating, failed, and empty-content states.
- [x] 4.3 Add or update router tests proving the protected preview route composes `DocumentPreviewPage`.
- [x] 4.4 Add or update Playwright coverage for an authenticated user opening `/app/documento/:documentId/preview` and seeing the preview page.

## 5. Verification

- [x] 5.1 Run the relevant documents-module React tests.
- [x] 5.2 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.3 Run `pnpm --filter @licitadoc/web lint`.
- [x] 5.4 Run the relevant Playwright/e2e coverage for the document preview page.
- [x] 5.5 Run `openspec status --change "add-document-preview-page"` and confirm the change is apply-ready.
