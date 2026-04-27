## 1. Duplicate Action Presentation

- [x] 1.1 Update the process-detail overflow menu so `Duplicar` is rendered as an enabled menu item with the approved copy icon and label presentation.
- [x] 1.2 Keep the duplicate action local to the process-detail page without changing existing create, edit, or preview routes.

## 2. Interim Feedback

- [x] 2.1 Add a local duplicate-action handler that shows explicit toast feedback that duplication is not available yet.
- [x] 2.2 Ensure the temporary duplicate interaction does not navigate away from the current process detail route or mutate document state.

## 3. Verification

- [x] 3.1 Add or update focused process-detail page tests for the enabled duplicate action and its toast feedback.
- [x] 3.2 Run the relevant web test command for the process detail page.