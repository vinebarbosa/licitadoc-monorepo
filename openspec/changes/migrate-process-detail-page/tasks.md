## 1. Backend Detail Payload

- [x] 1.1 Extend process detail serialization with `departments`, `estimatedValue`, enriched document cards, and a detail-level updated timestamp while preserving existing process profile fields.
- [x] 1.2 Query linked department records for the requested process and serialize labels matching the current frontend department display pattern.
- [x] 1.3 Query documents for the requested process and derive one card each for `dfd`, `etp`, `tr`, and `minuta`.
- [x] 1.4 Map document statuses to UI statuses: `completed` to `concluido`, `generating` to `em_edicao`, `failed` to `erro`, and missing records to `pendente`.
- [x] 1.5 Derive `estimatedValue` from process source metadata when available and return `null` otherwise.
- [x] 1.6 Update process detail schemas/OpenAPI examples and keep create/update/listing response contracts compatible.
- [x] 1.7 Add backend tests for enriched process detail, document-card derivation, department serialization, visibility scoping, and backward-compatible profile fields.

## 2. API Client And Frontend Data Model

- [x] 2.1 Regenerate `@licitadoc/api-client` after the OpenAPI schema changes.
- [x] 2.2 Add process detail query types/hooks to `apps/web/src/modules/processes/api/processes.ts`.
- [x] 2.3 Add frontend model helpers for process detail display labels, date formatting, status badge config, estimated-value fallback, document card metadata, and action links.
- [x] 2.4 Update MSW fixtures/handlers with representative enriched process detail responses.

## 3. Process Detail Page Migration

- [x] 3.1 Create the process detail page/component in the new process module by migrating `tmp/processo.tsx` structure to current imports and conventions.
- [x] 3.2 Register protected route `/app/processo/:processId` in `apps/web/src/app/router.tsx` with breadcrumbs compatible with the app shell.
- [x] 3.3 Render the process header, status badge, process number/type/department row, and `Visualizar`/`Editar` actions from API data.
- [x] 3.4 Render the process information card with responsible, estimated value, created date, last update, and description/object.
- [x] 3.5 Render the DFD, ETP, TR, and Minuta cards with the migrated icons, badges, progress bar, last update, and action buttons.
- [x] 3.6 Implement loading, error/not-found, and retry/back-to-list states without changing the validated visual layout for the success state.
- [x] 3.7 Ensure process listing links continue navigating to `/app/processo/:processId`.

## 4. Frontend Tests

- [x] 4.1 Add React tests proving the detail page renders the migrated header, summary card, and four document cards from API data.
- [x] 4.2 Add React tests for completed, in-editing, pending, and error document card states.
- [x] 4.3 Add React tests for loading and failed/not-found detail states.
- [x] 4.4 Update router tests to cover the protected process detail route.
- [x] 4.5 Add or update Playwright coverage for navigating from the process listing to the detail page and seeing the migrated UI.

## 5. Verification

- [x] 5.1 Run the relevant API unit tests for process detail and document aggregation.
- [x] 5.2 Run `pnpm --filter @licitadoc/api-client generate`.
- [x] 5.3 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 5.4 Run `pnpm --filter @licitadoc/web lint`.
- [x] 5.5 Run `pnpm --filter @licitadoc/web test`.
- [x] 5.6 Run the relevant web Playwright/e2e tests.
- [x] 5.7 Run `openspec status --change migrate-process-detail-page` and confirm the change is complete or ready for implementation, depending on phase.
