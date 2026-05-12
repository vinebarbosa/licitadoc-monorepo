## 1. Preview Surface Cleanup

- [x] 1.1 Remove the standalone document preview summary card component from `apps/web/src/modules/documents/ui/document-preview-page.tsx`.
- [x] 1.2 Update generating, failed, and empty-content render paths so they show the top action row followed directly by their state content.
- [x] 1.3 Keep the completed document sheet layout and top action row unchanged.

## 2. Tests And Validation

- [x] 2.1 Update document preview tests to stop expecting the removed title/process/last-update summary card in non-content states.
- [x] 2.2 Add or adjust assertions that loaded preview states still show the top actions and the correct state content.
- [x] 2.3 Run focused document preview tests, typecheck, and Biome checks for changed files.
