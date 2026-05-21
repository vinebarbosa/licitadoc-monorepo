## 1. Shared Dropzone Pattern

- [x] 1.1 Extend `FileUploadField` to support compact dropzone copy, drag-over state, and drop handling while keeping the hidden file input accessible.
- [x] 1.2 Add context-specific copy props for "Arraste o arquivo aqui..." style text without hard-coding SD or letterhead language inside the shared component.
- [x] 1.3 Ensure empty, dragging, selected, disabled, and error states use existing design tokens and stay stable with long filenames on desktop and mobile.

## 2. SD Import Dropzone

- [x] 2.1 Update `sd-import-dialog.tsx` to render a compact PDF dropzone with text like "Arraste o PDF aqui ou selecione o arquivo".
- [x] 2.2 Preserve `accept="application/pdf,.pdf"`, file reading, request cancellation behavior, extraction preview, error recovery, and the accessible label "Arquivo PDF da SD".
- [x] 2.3 Verify the dropzone remains visually compact inside the dialog and does not crowd loading, preview, warnings, cancel, or apply states.

## 3. Letterhead Dropzone

- [x] 3.1 Update the organization onboarding letterhead upload to render a more generous, but still contained, image dropzone.
- [x] 3.2 Preserve PNG/JPEG/WebP acceptance, 5 MB guidance, localized file size, remove action, validation errors, and accessible label "Papel timbrado da organização".
- [x] 3.3 Verify the section reads as a single polished upload area and not as a large decorative card.

## 4. Tests And Visual Validation

- [x] 4.1 Update process creation tests to cover the new SD dropzone copy while continuing to select files by accessible label.
- [x] 4.2 Update onboarding tests to cover the new letterhead dropzone copy, selected file state, and removal.
- [x] 4.3 Add or update component-level coverage for drag-and-drop behavior if existing page tests do not exercise dropped files.
- [x] 4.4 Run focused web tests for process creation, owner onboarding, and any shared upload component coverage.
- [x] 4.5 Capture visual checks for SD import and paper timbrado to confirm the dropzones are compact, in PT-BR, and free of native English browser copy.
