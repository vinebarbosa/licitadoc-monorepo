## 1. Preview UI Adaptation

- [x] 1.1 Compare `tmp/documento-preview.tsx` against `apps/web/src/modules/documents/ui/document-preview-page.tsx` and identify reusable validated UI elements.
- [x] 1.2 Rework the completed-document preview into a centered document-sheet layout with action row, official-style header, object/process context, content body, and footer/signature affordance.
- [x] 1.3 Keep the implementation inside `apps/web` module/shared boundaries and remove any need for runtime imports from `tmp`.

## 2. Data And State Preservation

- [x] 2.1 Map real document detail fields into the validated UI surface with graceful fallback text for missing organization, unit, object, and signature metadata.
- [x] 2.2 Preserve safe Markdown rendering inside the validated document body for completed documents with previewable content.
- [x] 2.3 Preserve loading, retryable error, forbidden/not-found, generating, failed, and empty-content states.
- [x] 2.4 Add visible return, print, DOCX export, and PDF export controls without introducing fake downloads when export integration is unavailable.

## 3. Verification

- [x] 3.1 Update document preview tests to cover the validated action surface and document-sheet layout while preserving existing data/state assertions.
- [x] 3.2 Run focused web tests and type/lint validation for the changed files, then fix any failures caused by this change.
