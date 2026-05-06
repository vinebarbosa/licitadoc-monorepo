## 1. Import Flow UX

- [x] 1.1 Remove the persistent TopDown PDF import card from the first viewport of `process-create-page.tsx`.
- [x] 1.2 Add a secondary "Importar SD" action near the page or form actions, using the existing design system and upload icon pattern.
- [x] 1.3 Implement an import dialog with file selection, loading state, success preview state, error state, cancel/close actions, and an explicit apply action.
- [x] 1.4 Ensure closing or cancelling the dialog never mutates existing form values.
- [x] 1.5 After applying a preview, show only a compact imported-data summary on the page with a way to reopen or replace the import.

## 2. Extraction and Data Mapping

- [x] 2.1 Add a representative TopDown SD fixture for parser regression, preferring sanitized extracted text derived from the real `SD.pdf` unless the raw PDF is explicitly approved for versioning.
- [x] 2.2 Align frontend PDF text normalization with the backend parser behavior for TopDown machine-readable PDFs.
- [x] 2.3 Update frontend SD parsing to extract request number, source reference, issue date, CNPJ, budget unit code/name, process type, classification/object, justification, responsible name, responsible role, and item metadata from the representative fixture.
- [x] 2.4 Normalize parsed values into the existing process creation form model without auto-submitting the process.
- [x] 2.5 Treat organization and department lookup failures as actionable matching warnings or field issues, not as PDF reading failures.
- [x] 2.6 Replace the generic import catch path with typed import results or typed errors for read failure, unrecognized SD, missing required fields, and matching issues.

## 3. Test Coverage

- [x] 3.1 Add parser tests proving the representative TopDown SD fixture extracts `SD-6-2026`, `2026-01-08`, `08.290.223/0001-42`, `06.001`, `Serviço`, object, justification, and responsible data.
- [x] 3.2 Add page tests for opening the dialog from the subtle import button and verifying the fixed import card no longer appears above the form.
- [x] 3.3 Add page tests proving cancel/close leaves manual form values unchanged.
- [x] 3.4 Add page tests proving apply fills the form and shows the compact imported-data summary.
- [x] 3.5 Add page tests for diagnostic error categories, including unreadable PDF, readable non-SD PDF, missing required SD fields, and organization or department mismatch.
- [x] 3.6 Update Playwright coverage for the new import dialog flow on `/app/processo/novo`.

## 4. Verification

- [x] 4.1 Run the web typecheck and fix any introduced TypeScript errors.
- [x] 4.2 Run the web lint target and address any new lint failures.
- [x] 4.3 Run the web unit test suite and confirm all process creation/import tests pass.
- [x] 4.4 Run the web Playwright/e2e process creation coverage and confirm the import dialog path passes.
- [x] 4.5 Run `openspec status --change refine-process-pdf-import-flow` and confirm the change is ready to apply or fully implemented, depending on phase.
