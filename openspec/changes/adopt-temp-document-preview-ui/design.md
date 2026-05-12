## Context

`tmp/documento-preview.tsx` contains a validated visual direction for document preview: a document-like canvas, action buttons for returning, printing, and exporting, official document header metadata, object/process context, sectioned content, and signature area. The current architecture already implements `/app/documento/:documentId/preview` under `apps/web/src/modules/documents`, backed by real document detail fetching, app-shell breadcrumbs, safe Markdown rendering, and robust loading/error/status states.

This change should merge those strengths: adopt the validated preview surface from `tmp` while keeping the production data flow, module boundaries, route guards, and Markdown safety behavior already present in `apps/web`.

## Goals / Non-Goals

**Goals:**
- Rework the document preview page into a document-sheet layout inspired by `tmp/documento-preview.tsx`.
- Keep all runtime code inside `apps/web/src/modules/documents` and shared UI primitives.
- Preserve API-backed document detail loading, polling behavior, status handling, failure states, and safe Markdown rendering.
- Surface top-level actions for returning to the document workflow, printing, exporting DOCX, and exporting PDF as visible controls.
- Use real document fields for title, process link/label, type, responsible summary, update date, and preview content with graceful fallback text.

**Non-Goals:**
- Introduce mock document data from `tmp/documento-preview.tsx`.
- Add new backend export APIs or generated client methods.
- Build a document editor route or a full section parser for every document type.
- Replace the existing Markdown renderer with unsafe raw HTML rendering.

## Decisions

- Treat `tmp/documento-preview.tsx` as visual reference, not source of truth.
  - Rationale: the temp component hardcodes mock data and imports legacy aliases, while the current page is wired to real document data and app-shell architecture.
  - Alternative considered: copy the temp file directly into `apps/web`; rejected because it would regress data loading, route integration, and architecture boundaries.

- Keep Markdown content as the canonical preview body.
  - Rationale: generated documents are stored as `draftContent`, and a previous change already made Markdown rendering semantic and safe.
  - Alternative considered: convert Markdown into hardcoded ETP-style section keys from the temp file; rejected because the API does not expose those section fields for all document types.

- Render document chrome around the Markdown preview.
  - Rationale: the validated UI's strongest value is the official document framing: action row, centered heading, object/process block, separators, paper card, and signature/footer area.
  - Alternative considered: keep the current metadata card above a generic Markdown card; rejected because it does not match the validated preview.

- Implement print/export affordances without pretending backend export exists.
  - Rationale: users should see the validated action surface, but this proposal does not add API contracts.
  - Alternative considered: hide export controls until backend export exists; rejected because the temp UI specifically validates those controls as part of the target surface.

## Risks / Trade-offs

- The document metadata API may not include official organization/unit/signature fields. → Use existing document/process/responsible/date fields and clear fallback labels until richer metadata exists.
- Export buttons may be present before export APIs are wired. → Keep actions as UI affordances with disabled state, no-op print-only behavior, or existing browser print where appropriate; avoid false download behavior.
- A more print-like card can become cramped on mobile. → Use responsive padding, wrapping action rows, and max-width constraints matching the temp layout.
- Existing tests assert the current metadata layout. → Update tests around stable behavior: metadata visibility, navigation, states, Markdown safety, and validated action surface.
