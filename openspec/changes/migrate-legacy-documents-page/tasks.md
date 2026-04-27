## 1. Backend Documents Listing Contract

- [x] 1.1 Extend `GET /api/documents` serialization and schemas with the process-context and responsible-summary fields required by the migrated documents page while preserving existing visibility rules.
- [x] 1.2 Load the related process data needed by the listing rows without introducing per-row frontend fetches, and keep the existing ordering/scoping behavior intact.
- [x] 1.3 Add or update backend tests for the enriched listing payload, actor scoping, and unchanged document-detail behavior.

## 2. API Client And Frontend Data Setup

- [x] 2.1 Regenerate `@licitadoc/api-client` after the documents listing contract changes.
- [x] 2.2 Create the `apps/web/src/modules/documents` public surface, query adapter, and model helpers for display labels, stats derivation, local filters, and row-action metadata.
- [x] 2.3 Add or update MSW fixtures/handlers for successful, empty, and failed documents-page responses.

## 3. Documents Page Migration

- [x] 3.1 Migrate the validated layout from `tmp/documentos.tsx` into the new documents page/module using the current shared UI imports and conventions, without redesigning the interface.
- [x] 3.2 Register the protected `/app/documentos` route in `apps/web/src/app/router.tsx` and honor the existing `?tipo=` deep links from the sidebar.
- [x] 3.3 Render the summary cards, search field, filters, and table rows from real API data, with client-side filtering for text, type, and status.
- [x] 3.4 Keep stable process/document navigation links and provide explicit non-destructive feedback for unsupported row actions.
- [x] 3.5 Implement loading, empty, and error/retry states for the page without changing the validated success-state layout.

## 4. Frontend Tests

- [x] 4.1 Add or update React tests proving the migrated documents page renders the validated header, summary cards, filters, and enriched table rows from API data.
- [x] 4.2 Add or update React tests for `?tipo=` deep-link handling, local filtering behavior, and temporary feedback for unsupported row actions.
- [x] 4.3 Add or update React tests for loading, empty, and failed documents-page states.
- [x] 4.4 Add or update Playwright coverage for reaching `/app/documentos` and seeing the migrated UI in the protected shell.

## 5. Verification

- [x] 5.1 Run the relevant API unit tests for documents listing.
- [x] 5.2 Run `pnpm --filter @licitadoc/api-client generate`.
- [x] 5.3 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.4 Run `pnpm --filter @licitadoc/web lint`.
- [x] 5.5 Run the relevant web test command for the documents page.
- [x] 5.6 Run the relevant web Playwright/e2e coverage for the documents page.