## Context

The document preview page renders completed documents with the official paged preview surface. The toolbar currently exposes "Imprimir", "Exportar DOCX", and "Exportar PDF". "Imprimir" and "Exportar PDF" both call `window.print()`, so they are visually different commands with identical behavior.

The existing preview route already depends on browser-side pagination through PagedJS. The safest product fix is to keep print as the browser print dialog and make PDF export produce a downloaded file from the rendered pages. This avoids removing an expected print action while making the PDF action honest.

## Goals / Non-Goals

**Goals:**

- Make "Exportar PDF" download a `.pdf` file instead of opening the browser print dialog.
- Keep "Imprimir" as the print dialog action.
- Export the same official paged preview pages shown on screen, including letterhead background where loaded.
- Prevent duplicate export clicks while a PDF is being generated.
- Keep export disabled until the completed paged preview is renderable.

**Non-Goals:**

- Implement DOCX export.
- Add a backend PDF rendering service.
- Replace PagedJS pagination.
- Guarantee selectable/vector text in the first implementation if a browser rasterization path is used.

## Decisions

### Decision 1: Export from rendered PagedJS pages on the client

The implementation should export from `[data-paged-preview-output] .pagedjs_page` so the downloaded PDF matches the same paged layout users inspect before export. This keeps the change scoped to the web preview route and avoids new API contracts.

Alternative considered: backend PDF generation. It would allow stronger control over PDF fidelity and selectable text, but it introduces service-side browser rendering or a PDF engine, authentication concerns for letterhead assets, and substantially more infrastructure.

### Decision 2: Use a small PDF export utility instead of embedding export logic in the page component

Add a document preview PDF export helper that accepts the rendered page elements, a file name, and export options. The page component should only handle button state, element lookup, and user feedback.

Alternative considered: inline everything in `DocumentPreviewActions`. That would be faster initially, but it makes tests and future replacement with a backend/vector exporter messier.

### Decision 3: Add client PDF generation dependencies only if existing libraries cannot do the job

The current web dependencies include `pdfjs-dist`, which reads PDFs but does not generate them. If no existing library can generate the file, add focused client dependencies such as `jspdf` plus DOM/page capture support. The export helper should isolate those dependencies.

Alternative considered: use `window.print()` and rely on "Save as PDF". That is the current duplicate behavior and does not satisfy the user's request for a real export action.

### Decision 4: Use explicit busy/error feedback

The PDF button should show a pending state while pages are captured and should surface a toast/error if the export cannot be produced. Export failures should not affect the preview or print action.

Alternative considered: silent failure. That would make a file-generation action feel unreliable and hard to diagnose.

## Risks / Trade-offs

- [Risk] Browser-generated PDFs may be rasterized rather than selectable text. -> Keep the helper isolated so a later backend or vector implementation can replace it without changing the toolbar contract.
- [Risk] Cross-origin letterhead images can taint canvas capture. -> Use the API asset URL with CORS-safe loading and test/export with the Pureza letterhead path.
- [Risk] Large documents may take noticeable time to export. -> Disable the button during export and show a concise pending label.
- [Risk] PagedJS may not have finished rendering when the button appears. -> Gate export on the presence of rendered `.pagedjs_page` nodes and report a controlled error if no pages exist.

## Migration Plan

1. Add or isolate PDF export dependencies and utility code.
2. Wire "Exportar PDF" to the utility and keep "Imprimir" on `window.print()`.
3. Add focused unit tests for action separation, export state, and missing rendered pages.
4. Verify manually in the local app with a completed document that has letterhead.

Rollback: remove the PDF export utility and return the button to disabled or print behavior, or remove the PDF button if export fidelity is unacceptable.
