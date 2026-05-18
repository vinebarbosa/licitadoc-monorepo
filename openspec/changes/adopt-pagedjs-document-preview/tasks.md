## 1. Dependency And Module Setup

- [x] 1.1 Add `pagedjs` to the web workspace dependency list using the repository package manager.
- [x] 1.2 Add or verify TypeScript declarations for `pagedjs` so imports of `Previewer` are type-safe.
- [x] 1.3 Create `apps/web/src/modules/documents/ui/paged-preview/` for the paged preview module.
- [x] 1.4 Export the paged preview public API from an `index.ts` file.

## 2. Paged.js Hook

- [x] 2.1 Implement `usePagedPreview` with typed source and output refs.
- [x] 2.2 Instantiate `Previewer` inside the hook and render from the hidden source container into the visible output container.
- [x] 2.3 Clear previous generated pages before every render to prevent duplicate pages.
- [x] 2.4 Guard asynchronous renders with a render version or cancellation flag so stale renders cannot update state.
- [x] 2.5 Clean generated output and pending state on component unmount.
- [x] 2.6 Expose render status, error state, and a manual rerender function from the hook.

## 3. Paged Preview Components

- [x] 3.1 Implement `DocumentPreview.tsx` with hidden `#paged-root` and `.page-content` source markup.
- [x] 3.2 Implement the visible Paged.js output container and loading/error UI inside `DocumentPreview`.
- [x] 3.3 Implement `PaperLayout.tsx` with document layout props for page margins, institutional data, watermark, and children.
- [x] 3.4 Implement `PageHeader.tsx` for logo, organization name, department, and optional document metadata.
- [x] 3.5 Implement `PageFooter.tsx` for address, CNPJ, contact text, and page numbering support.
- [x] 3.6 Implement an optional `DocumentWatermark.tsx` for logo/image watermark rendering.
- [x] 3.7 Add the `Exportar PDF` action that invokes `window.print()`.

## 4. Paged Preview Styles

- [x] 4.1 Create `paged-preview.css` and import it from the paged preview module or global stylesheet entrypoint.
- [x] 4.2 Define the base paged media rule `@page { size: A4; margin: 20mm; }`.
- [x] 4.3 Add screen styles for page preview with white A4 pages, restrained shadow, page spacing, and centered document canvas.
- [x] 4.4 Add print styles that hide app chrome and preview-only controls while preserving generated pages.
- [x] 4.5 Add CSS for repeated header/footer, page counters, optional watermark, and institutional typography.
- [x] 4.6 Add rich-content rules for headings, paragraphs, lists, images, tables, table headers, signatures, and break avoidance.
- [x] 4.7 Ensure Tailwind utility classes and Paged.js generated classes can coexist without leaking app UI styling into print output.

## 5. Content Sources And Example

- [ ] 5.1 Add a safe path to render TipTap JSON or existing document content into HTML/React suitable for Paged.js.
- [ ] 5.2 Preserve the existing Markdown/document renderer as fallback for unsupported or legacy content.
- [x] 5.3 Implement `DocumentPreviewExample.tsx` with logo, header, footer, watermark, long mocked body, table, list, and signature.
- [x] 5.4 Add enough mock content in the example to force multiple pages.
- [x] 5.5 Document the intended data flow: `Editor/TipTap -> HTML React -> Paged.js -> Preview paginado -> Print/PDF`.

## 6. Integration With Existing Preview

- [ ] 6.1 Integrate `DocumentPreview` into the completed document preview path when content is supported by the paged renderer.
- [ ] 6.2 Keep loading, generating, failed, empty, and retry states outside the Paged.js rendering path.
- [ ] 6.3 Preserve existing preview actions and enable `Exportar PDF` only when completed content can be printed.
- [ ] 6.4 Preserve the current letterhead URL behavior and map it to the paged preview header/background/watermark model.
- [ ] 6.5 Ensure app navigation, planning panels, live generation indicators, and action bars do not appear in printed output.

## 7. Testing And Verification

- [ ] 7.1 Add unit tests for `usePagedPreview` cleanup, rerender, stale render handling, and duplicate-page prevention.
- [ ] 7.2 Add component tests for `DocumentPreview`, `PaperLayout`, `PageHeader`, `PageFooter`, watermark, and export action.
- [ ] 7.3 Update document preview tests to cover the Paged.js path and the fallback path.
- [ ] 7.4 Add or update browser verification for a multi-page document with tables, lists, images, signature, watermark, and print output.
- [ ] 7.5 Run focused web tests for the document preview module.
- [x] 7.6 Run web typecheck and formatting/lint checks for changed files.
- [ ] 7.7 Validate the OpenSpec change after implementation.
