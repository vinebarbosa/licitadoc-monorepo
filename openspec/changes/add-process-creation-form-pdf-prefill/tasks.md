## 1. API Adapters And Form Model

- [x] 1.1 Extend `apps/web/src/modules/processes/api/processes.ts` with adapters for process creation, departments list, and admin organizations list using `@licitadoc/api-client`.
- [x] 1.2 Add model types for process creation form values, PDF extraction result, extraction warnings, and submit payload mapping.
- [x] 1.3 Add form helper functions for default values, role-aware organization handling, department option mapping, date normalization, and backend error message extraction.
- [x] 1.4 Add unit tests for form defaults, payload mapping, required-field validation helpers, and role-aware organization behavior.

## 2. PDF Extraction And TopDown Parsing

- [x] 2.1 Add a browser-compatible PDF text extraction dependency to `apps/web` if it is not already available there.
- [x] 2.2 Implement a lazy-loaded PDF text extraction helper that accepts one file, validates PDF shape, extracts machine-readable text, and reports unreadable/encrypted/image-only failures.
- [x] 2.3 Implement a TopDown Solicitacao de Despesa parser that derives process type, process number/source reference, external id/request number, issue date, object, justification, responsible name, organization hints, department hints, and warnings.
- [x] 2.4 Implement a mapper that applies extraction suggestions to editable form values without overwriting user edits unexpectedly.
- [x] 2.5 Add unit tests for readable TopDown text, missing optional fields, missing required fields, unreadable extraction errors, and repeated PDF import replacement.

## 3. Route And Page Composition

- [x] 3.1 Add and export a process creation page entrypoint from `apps/web/src/modules/processes`.
- [x] 3.2 Register protected route `/app/processo/novo` in `apps/web/src/app/router.tsx` with process-creation breadcrumbs.
- [x] 3.3 Ensure existing new-process links in the listing page and sidebar navigate to the new route and active states remain coherent.
- [x] 3.4 Add router tests covering authenticated access, unauthenticated protection, and breadcrumb/page rendering for `/app/processo/novo`.

## 4. Creation Form UI

- [x] 4.1 Build the process creation page layout using existing shared UI primitives with a compact operational form rather than a landing-style page.
- [x] 4.2 Add editable controls for type, process number, external id, issue date, object, justification, responsible name, status/default, organization for admins, and department multi-selection.
- [x] 4.3 Add PDF import control with loading, success, warning, replacement, and failure states.
- [x] 4.4 Surface extraction warnings next to the affected fields and keep every pre-filled field editable.
- [x] 4.5 Render loading, empty, retry, and blocking states for department and admin organization reference data.
- [x] 4.6 Add responsive behavior so labels, fields, actions, and warning text do not overlap on mobile or desktop.

## 5. Submission Flow

- [x] 5.1 Wire form submission to `POST /api/processes/` through the processes module adapter.
- [x] 5.2 Include reviewed form values in the submit payload, including `sourceKind`, `sourceReference`, and structured `sourceMetadata` when data came from an imported PDF.
- [x] 5.3 Prevent submission while required fields, departments, or admin organization selection are invalid.
- [x] 5.4 Display backend validation, scope, missing organization, foreign department, and duplicate-process-number errors in the form context.
- [x] 5.5 Invalidate process list queries after successful creation and navigate to the created process route when available or back to `/app/processos` with success feedback.

## 6. Tests And Verification

- [x] 6.1 Add MSW handlers and fixtures for departments, organizations, process creation success, and process creation errors.
- [x] 6.2 Add Vitest coverage for manual creation, admin organization selection, organization-scoped creation, PDF prefill, editable extracted fields, extraction failure, and backend rejection recovery.
- [x] 6.3 Add Playwright coverage for the navigable creation route and a representative manual creation flow.
- [x] 6.4 Run `pnpm --filter @licitadoc/web typecheck`.
- [x] 6.5 Run `pnpm --filter @licitadoc/web lint`.
- [x] 6.6 Run `pnpm --filter @licitadoc/web test`.
- [x] 6.7 Run `pnpm --filter @licitadoc/web test:e2e` if the local environment supports browser tests.
