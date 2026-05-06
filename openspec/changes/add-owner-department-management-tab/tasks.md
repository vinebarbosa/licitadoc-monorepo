## 1. Department module foundation

- [x] 1.1 Create `apps/web/src/modules/departments` with public exports for owner-facing department UI and helpers.
- [x] 1.2 Add owner department API adapters backed by `useGetApiDepartments`, `usePostApiDepartments`, and department query invalidation.
- [x] 1.3 Add owner department model helpers for form defaults, slug generation, payload mapping, display labels, and API error-message extraction.

## 2. Owner administration tabs

- [x] 2.1 Update the owner members page heading/copy to represent organization administration while keeping `/app/membros` and the member workflow as the default tab.
- [x] 2.2 Add shared tabs for Members and Departments using existing UI primitives and stable responsive layout.
- [x] 2.3 Move the existing member list/invite sections into the Members tab without changing the current member actions.
- [x] 2.4 Add the Departments tab content from the departments module, including department list, empty state, loading state, error state, and retry action.

## 3. Department creation workflow

- [x] 3.1 Add a create-department dialog with fields for name, slug, optional budget unit code, responsible name, and responsible role.
- [x] 3.2 Auto-fill the slug from the department name until the owner manually edits the slug.
- [x] 3.3 Validate required fields before submit and disable submission while required values are missing or a create mutation is pending.
- [x] 3.4 Submit department creation through the existing API contract, refresh department lists after success, close/reset the dialog, and show success feedback.
- [x] 3.5 Show API rejection messages when available and keep the create dialog open for correction.

## 4. Tests and fixtures

- [x] 4.1 Add or update MSW fixtures and handlers for owner-scoped department list and department creation responses.
- [x] 4.2 Add model tests for slug generation, payload mapping, and error-message extraction.
- [x] 4.3 Add page tests proving the owner page exposes Members and Departments tabs and preserves the existing member default workflow.
- [x] 4.4 Add page tests for department listing, empty state, load error with retry, successful creation, required-field validation, and API rejection feedback.
- [x] 4.5 Add or update route/sidebar tests if page labels, breadcrumbs, or owner navigation text changes.

## 5. Verification

- [x] 5.1 Run focused web tests for users/departments owner administration behavior.
- [x] 5.2 Run frontend typecheck/lint or the closest package validation command used by the repo.
- [x] 5.3 Run OpenSpec status/validation for `add-owner-department-management-tab` and address any artifact issues.
