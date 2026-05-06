## 1. Backend process listing contract

- [x] 1.1 Extend `processesPaginationQuerySchema` with optional `search`, `status`, and `type` query params while preserving existing `page` and `pageSize`
- [x] 1.2 Update `getProcesses` to apply actor visibility, search, status, and type filters consistently to both count and page queries
- [x] 1.3 Add a document-progress helper that aggregates related documents for the current process page without N+1 queries
- [x] 1.4 Serialize each process list item with document summary fields: `completedCount`, `totalRequiredCount`, `completedTypes`, and `missingTypes`
- [x] 1.5 Add a derived activity timestamp for list display using the latest date between the process and related documents, without changing persisted `process.updatedAt`
- [x] 1.6 Confirm no database migration is required; add one only if the implementation reveals a real schema need

## 2. Backend validation

- [x] 2.1 Add process unit tests for search across process number, external id, object, and responsible name
- [x] 2.2 Add process unit tests for status/type filters combined with existing organization scope
- [x] 2.3 Add tests for document progress aggregation, including duplicate document types, failed documents, missing types, and completed documents
- [x] 2.4 Add tests for derived activity timestamp when a related document is newer than the process
- [x] 2.5 Update process E2E coverage for the evolved listing contract and authorization boundaries

## 3. OpenAPI and client generation

- [x] 3.1 Regenerate or update API OpenAPI artifacts after the process list schema changes
- [x] 3.2 Regenerate `@licitadoc/api-client` from the updated OpenAPI contract
- [x] 3.3 Verify generated client types expose the new process list query params and document summary fields

## 4. Web module and route setup

- [x] 4.1 Create `apps/web/src/modules/processes` with `pages`, `ui`, `model`, `api`, and public `index.ts`
- [x] 4.2 Add a protected `/app/processos` route in `apps/web/src/app/router.tsx` with breadcrumbs for `Central de Trabalho > Processos`
- [x] 4.3 Add a processes API adapter backed by the generated client and invalidation/query-key behavior appropriate for list reads
- [x] 4.4 Add model helpers for URL filters, query params, status labels/classes, type labels, date formatting, and document-progress rendering

## 5. Processes page implementation

- [x] 5.1 Migrate the visual composition from `tmp/processos.tsx` into the real processes page while replacing legacy imports with current `@/shared/ui` primitives
- [x] 5.2 Connect search, status filter, type filter, and pagination to URL state and backend query params
- [x] 5.3 Render real process rows with number, object/name, status badge, type, responsible, document progress, and derived last update
- [x] 5.4 Implement loading, empty, and error states that preserve the table-oriented layout and never render mock rows
- [x] 5.5 Preserve the primary `Novo Processo` CTA route currently used by the app shell

## 6. Web validation

- [x] 6.1 Add page/model tests covering restored URL filters and generated API query params
- [x] 6.2 Add page tests covering loaded rows, document progress dots, loading state, empty state, and error retry affordance
- [x] 6.3 Update MSW fixtures/handlers for the evolved process listing response
- [x] 6.4 Run focused API and web validations for the touched slice, including process tests, generated client checks, and frontend tests
