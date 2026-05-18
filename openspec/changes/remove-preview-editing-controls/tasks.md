## 1. Preview UI Cleanup

- [x] 1.1 Remove text-adjustment imports, types, state, mutations, callbacks, and panel rendering from `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
- [x] 1.2 Remove preview selection interception and adjustment skeleton overlay props from `DocumentSheet` while preserving normal document rendering and native text selection.
- [x] 1.3 Verify preview still renders completed, generating, failed, empty, print, and export states without content editing affordances.

## 2. Test Updates

- [x] 2.1 Replace preview adjustment-flow tests with a read-only selection test that asserts no "Ajustar texto" panel appears and no adjustment API calls are made.
- [x] 2.2 Remove obsolete preview tests for suggestion generation, apply flow, dismiss behavior, and adjustment skeleton overlays.
- [x] 2.3 Keep or add editor-page coverage for text adjustment behavior only if that behavior is currently owned by the dedicated editor page.

## 3. Validation

- [x] 3.1 Run the document preview page test file for the web app.
- [x] 3.2 Run the relevant web validation command if preview cleanup touches shared document rendering components.
- [x] 3.3 Confirm OpenSpec status reports the change as ready for implementation.
