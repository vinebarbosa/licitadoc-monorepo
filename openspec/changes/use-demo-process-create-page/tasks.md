## 1. Reference Data and Payload Mapping

- [x] 1.1 Add or update process module API hooks for organization, department, user, and create-process data needed by the production create page.
- [x] 1.2 Add production mapping helpers that convert the demo form state into the canonical process create payload.
- [x] 1.3 Ensure organization-scoped actors resolve organization defaults and filter department/user options by organization.

## 2. Production Page Implementation

- [x] 2.1 Replace the placeholder authenticated process create page with the validated demo wizard structure.
- [x] 2.2 Remove demo-only sample data from the authenticated page and wire controls to API-backed reference data.
- [x] 2.3 Preserve demo simple-item, kit-item, kit-component, validation, step navigation, and review behavior.
- [x] 2.4 Submit the canonical API payload and navigate to created process detail on success.
- [x] 2.5 Show loading, empty, validation, and API error states without changing the validated visual model.

## 3. Tests and Verification

- [x] 3.1 Update process create page tests for the demo-aligned production wizard and canonical API payload.
- [x] 3.2 Run the relevant web typecheck and tests for process creation.
