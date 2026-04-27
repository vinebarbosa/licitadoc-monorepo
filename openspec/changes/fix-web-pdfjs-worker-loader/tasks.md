## 1. Worker Setup

- [x] 1.1 Import the bundled `pdfjs-dist` worker URL through Vite-compatible syntax.
- [x] 1.2 Configure `GlobalWorkerOptions.workerSrc` before the default loader calls `getDocument`.
- [x] 1.3 Keep injected `PdfLoader` behavior unchanged for tests and non-default callers.
- [x] 1.4 Remove raw `console.log(error)` from the PDF error conversion path.

## 2. Test Coverage

- [x] 2.1 Add or update TypeScript declarations for the `pdf.worker.mjs?url` import if needed.
- [x] 2.2 Add unit coverage proving the default loader configures worker source before reading a PDF.
- [x] 2.3 Keep existing injected-loader parser tests passing without requiring a real worker.
- [x] 2.4 Add or update browser/e2e coverage so selecting a PDF in the import dialog does not fail with missing `workerSrc`.

## 3. Verification

- [x] 3.1 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 3.2 Run `pnpm --filter @licitadoc/web lint`.
- [x] 3.3 Run `pnpm --filter @licitadoc/web test`.
- [x] 3.4 Run `pnpm --filter @licitadoc/web test:e2e` or the focused process-create e2e path.
- [x] 3.5 Run `openspec status --change fix-web-pdfjs-worker-loader` and confirm artifacts/tasks are ready for implementation or complete, depending on phase.
