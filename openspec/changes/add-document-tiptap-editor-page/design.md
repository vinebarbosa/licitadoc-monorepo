## Context

The web app already has a protected documents module, a mature preview route at `/app/documento/:documentId/preview`, document detail loading through `GET /api/documents/:documentId`, and helper links that distinguish edit and preview URLs. Several product surfaces already point editing to `/app/documento/:documentId`, but that route is not registered and the current preview remains read-only.

The backend persists generated draft content in `documents.draftContent` as Markdown-like text and already exposes document detail, lifecycle status, process context, responsibles, and timestamps. The text adjustment flow can update selected ranges, but it is not a general document editing contract. A full editor needs its own update endpoint, conflict protection, API client generation, and frontend state around safe saves.

## Goals / Non-Goals

**Goals:**

- Add a protected Tiptap-based document editing page at `/app/documento/:documentId`.
- Keep `/app/documento/:documentId/preview` as the read-only review/export surface.
- Preserve `draftContent` as the canonical persisted format so generation, preview, and future export paths stay aligned.
- Provide a premium institutional editing experience: calm, clear, important, simple to operate, and explicit about save safety.
- Add a scoped API update contract that persists full draft edits without changing process ownership, document type, or generation metadata.
- Cover routing, editing, save success, stale-save conflict, unavailable states, and unchanged preview behavior with tests.

**Non-Goals:**

- Replace the preview page with an editor.
- Implement collaborative real-time editing, comments, track changes, approval workflows, or document version history.
- Build final DOCX/PDF export behavior beyond preserving existing preview actions.
- Redesign the whole documents listing, process detail page, or app shell.
- Store Tiptap JSON or HTML as the primary backend document format in this change.

## Decisions

### Decision: Add a dedicated `DocumentEditPage`

The page entrypoint should live in `apps/web/src/modules/documents/pages/document-edit-page.tsx`, be exported from the documents module public API, and be registered in `apps/web/src/app/router.tsx` as `/app/documento/:documentId` under the existing protected app shell. The preview route remains separate and accessible from the editor.

Alternatives considered:

- Reuse `DocumentPreviewPage` and toggle edit mode: rejected because preview has generation streaming, print/export concerns, and read-only adjustment behavior that would make the editor harder to reason about.
- Create a new top-level module: rejected because editing is part of the existing documents workflow and should stay inside the module boundary.

### Decision: Keep Markdown-like `draftContent` as canonical storage

The editor should initialize Tiptap from the stored `draftContent` and serialize the edited document back to `draftContent` on save. A small adapter module should own the conversion boundary so the UI does not care whether the implementation uses an official Tiptap Markdown package or a Markdown/HTML bridge. The preview continues to render the persisted content through the existing safe Markdown preview path.

Alternatives considered:

- Persist Tiptap JSON: rejected for this change because it would require new data shape decisions and preview/export migration work.
- Persist editor HTML: rejected because it increases sanitization risk and diverges from the generation output format.
- Edit raw Markdown in a textarea: rejected because the requested experience explicitly calls for Tiptap and a premium rich editing workflow.

### Decision: Add `PATCH /api/documents/:documentId` for full draft saves

The API should accept the updated `draftContent` plus a `sourceContentHash` for stale-write protection, reuse the same document management scope as reads, reject edits for documents that are not completed, update `updatedAt`, and return the updated document detail. The existing adjustment endpoints remain focused on AI-assisted selected-text changes.

Alternatives considered:

- Reuse `POST /adjustments/apply`: rejected because that endpoint applies range-specific replacements and cannot represent arbitrary full-document edits cleanly.
- Save through a frontend-only cache mutation: rejected because edits must persist and be visible in preview and future sessions.
- Skip stale-write protection: rejected because document edits are high-trust institutional work and silent overwrites would undermine confidence.

### Decision: Use explicit save confidence instead of silent autosave

The first editor should use an explicit Save action, `Ctrl/Cmd+S`, a visible dirty/saved/error status, stale-save handling, and a before-unload guard when edits are unsaved. This creates a safer institutional feel than invisible autosave while still keeping the workflow fluid.

Alternatives considered:

- Silent autosave: useful later, but it adds conflict, retry, and user-trust complexity before there is version history.
- Save only on navigation: rejected because users need direct confirmation that an important document is persisted.

### Decision: Build a focused institutional editor shell

The UI should use the existing app shell, shared primitives, design tokens, and lucide icons. The page should present a compact command bar with back, preview, save status, and primary save action; a stable Tiptap toolbar with familiar icon controls; a centered document canvas that echoes the preview typography; and a restrained context area for metadata and safety state when space allows. It should avoid marketing-like hero sections, generic template cards, decorative gradients, and dense nested cards.

Alternatives considered:

- A generic admin form layout: rejected because document editing should feel more consequential and focused than a CRUD form.
- A full-screen blank editor: rejected because users need process context, document status, save state, and a clear path to preview.

## Risks / Trade-offs

- [Risk] Markdown-to-Tiptap conversion may not preserve every Markdown edge case. -> Mitigation: start with headings, paragraphs, emphasis, lists, blockquotes, links, horizontal rules, and tables where supported; keep conversion isolated behind tests.
- [Risk] Adding Tiptap increases the frontend dependency surface. -> Mitigation: install only the extensions used by the toolbar and keep editor configuration local to the documents module.
- [Risk] Full-document saves can overwrite newer content from another tab or adjustment flow. -> Mitigation: require `sourceContentHash`, return a conflict for stale saves, and keep unsaved editor content intact on conflict.
- [Risk] The editor could diverge visually from preview. -> Mitigation: reuse institutional document theme tokens where practical and add tests for preview receiving saved content.
- [Risk] Users may try to edit while a document is still generating. -> Mitigation: show a non-editable state with generation context and route users to preview/progress instead of mounting the editor.

## Migration Plan

1. Add the API update schema, service, route, and tests.
2. Regenerate `@licitadoc/api-client`.
3. Add Tiptap dependencies and the document editor conversion adapter.
4. Build the editor page, route, and entry-point link updates.
5. Validate with unit/component tests, API tests, typecheck, lint, and focused e2e coverage.

Rollback is straightforward because the new editor route and API endpoint are additive. If needed, remove the route/link changes and leave preview as the stable read-only path.

## Open Questions

- None for the first implementation. Autosave, version history, comments, and approval flows should be considered separate changes after the core editor is stable.
