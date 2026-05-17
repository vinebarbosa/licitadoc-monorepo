## Why

Generated documents currently have a mature preview surface, but the primary edit path is missing even though the product already points edit actions to `/app/documento/:documentId`. LicitaDoc needs a dedicated rich editing experience so teams can safely refine procurement drafts after generation without leaving the institutional workflow.

## What Changes

- Add a protected document editing page at `/app/documento/:documentId` powered by Tiptap.
- Provide a premium institutional editor experience with a calm document canvas, focused formatting controls, save confidence, and clear navigation back to preview and document lists.
- Allow authorized users to update persisted draft content while preserving the existing generated document detail and preview behavior.
- Surface document metadata, process context, status, last-saved state, and safe error/empty/loading states inside the editor.
- Update existing document entry points so document names and edit actions route to the editor, while preview actions remain available for final review/export.
- Add frontend and API tests covering routing, loading, editing, save success, save failure, authorization/scoping, and unchanged preview behavior.

## Capabilities

### New Capabilities
- `document-rich-text-editing`: Covers the protected Tiptap-based document editing route, editing workflow, persistence contract, and premium institutional user experience for generated document drafts.

### Modified Capabilities
- None.

## Impact

- Web app: `apps/web/src/app/router.tsx`, `apps/web/src/modules/documents`, document list/process/home entry points, shared UI primitives, and tests.
- API app: document update schema, route, service, policies, OpenAPI output, and document tests.
- API client: regenerated document update client/hooks after the API contract is added.
- Dependencies: add Tiptap packages to `apps/web` and any small Markdown/HTML conversion helpers needed to preserve the existing `draftContent` storage format.
- UX: introduce an institutional editor page that feels modern, safe, important, and consistent with the existing LicitaDoc application shell.
