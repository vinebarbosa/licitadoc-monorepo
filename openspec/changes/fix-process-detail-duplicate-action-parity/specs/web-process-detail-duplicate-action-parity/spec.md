## ADDED Requirements

### Requirement: Process detail duplicate actions MUST preserve the approved enabled presentation
The authenticated web process detail page MUST render the `Duplicar` action in each document card overflow menu as a normal enabled menu item, with the approved copy icon and label presentation from the validated reference layout.

#### Scenario: Overflow menu shows an enabled duplicate action
- **WHEN** a user opens a document card overflow menu on the process detail page
- **THEN** the `Duplicar` menu item is rendered as an enabled action with the copy icon before its label

### Requirement: Process detail duplicate actions MUST provide interim user feedback until duplication exists
Until a dedicated document duplication workflow is implemented, the authenticated web process detail page MUST respond to `Duplicar` selections with explicit user feedback that the action is not available yet, without changing the current document routes or mutating document data.

#### Scenario: Selecting duplicate shows temporary availability feedback
- **WHEN** a user selects `Duplicar` from a process detail document card overflow menu
- **THEN** the page shows a user-visible feedback message that duplication is not available yet

#### Scenario: Selecting duplicate does not navigate or mutate document state
- **WHEN** a user selects `Duplicar` from a process detail document card overflow menu
- **THEN** the page keeps the current process detail route and leaves existing create, edit, and preview document actions unchanged