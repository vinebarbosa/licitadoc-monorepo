## 1. Backend Create Contract

- [x] 1.1 Extend `POST /api/documents` schemas and create logic to accept an optional custom document name, trimming blanks and preserving the current generated-name fallback.
- [x] 1.2 Add or update backend tests for custom-name persistence, blank-name fallback, and unchanged scope enforcement during document creation.

## 2. API Client And Frontend Data Setup

- [x] 2.1 Regenerate `@licitadoc/api-client` after the document-create contract changes.
- [x] 2.2 Add or update documents-module API adapters/types for the create mutation and for loading visible processes into the picker using the current frontend architecture.
- [x] 2.3 Add or update MSW fixtures/handlers for process-picker loading plus document-create success and failure responses.

## 3. New Document Page Migration

- [x] 3.1 Migrate the validated layout from `tmp/documento-novo.tsx` into the `apps/web/src/modules/documents` module without redesigning the interface.
- [x] 3.2 Register the protected `/app/documento/novo` route in `apps/web/src/app/router.tsx` and honor `?tipo=` and `?processo=` deep links.
- [x] 3.3 Render real process options, resolve deep-link preselection, and keep the suggested document name in sync with the selected type/process until the actor edits it.
- [x] 3.4 Submit the real create mutation with loading/error handling and navigate to the chosen stable post-create destination using the returned document id.
- [x] 3.5 Handle process-picker loading, invalid deep-link, and no-visible-process states without breaking the validated success-state layout.

## 4. Frontend Tests

- [x] 4.1 Add or update React tests proving the migrated page renders the validated UI and honors `tipo`/`processo` deep links.
- [x] 4.2 Add or update React tests for suggested-name behavior, custom-name submission, success navigation, and failed create feedback.
- [x] 4.3 Add or update React tests for process-picker loading and invalid/empty visibility states.
- [x] 4.4 Add or update Playwright coverage for reaching `/app/documento/novo` in the protected shell and completing the real create flow with mocked APIs.

## 5. Verification

- [x] 5.1 Run the relevant API unit tests for document creation.
- [x] 5.2 Run `pnpm --filter @licitadoc/api-client generate`.
- [x] 5.3 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.4 Run `pnpm --filter @licitadoc/web lint`.
- [x] 5.5 Run the relevant web test command for the new document page.
- [x] 5.6 Run the relevant web Playwright/e2e coverage for the new document page.