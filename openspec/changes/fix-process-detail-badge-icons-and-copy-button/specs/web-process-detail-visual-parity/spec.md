## ADDED Requirements

### Requirement: Process detail document status badges MUST preserve the approved iconography
The authenticated web process detail page MUST render each document status badge with the approved status icon so the badge communicates state consistently with the validated reference layout. `concluido` MUST show a confirmation icon, `em_edicao` and `pendente` MUST show a clock-style icon, and `erro` MUST show a warning icon.

#### Scenario: Completed document shows the approved confirmation badge icon
- **WHEN** a process detail document card is rendered with status `concluido`
- **THEN** its badge shows the completed label together with the approved confirmation icon rather than a document-type or action icon

#### Scenario: In-progress and pending documents show the approved time badge icon
- **WHEN** a process detail document card is rendered with status `em_edicao` or `pendente`
- **THEN** its badge shows the corresponding label together with the approved clock-style icon

#### Scenario: Errored document shows the approved warning badge icon
- **WHEN** a process detail document card is rendered with status `erro`
- **THEN** its badge shows the error label together with the approved warning icon

### Requirement: Process detail document overflow menus MUST preserve the duplicate affordance presentation
The authenticated web process detail page MUST render the `Duplicar` action in each document card overflow menu with the approved copy icon and menu-item presentation from the validated reference layout while preserving the current interaction behavior already supported by the page.

#### Scenario: Overflow menu shows the duplicate iconography
- **WHEN** a user opens a document card overflow menu on the process detail page
- **THEN** the `Duplicar` menu item is displayed with a copy icon before its label

#### Scenario: Duplicate action keeps the current workflow scope
- **WHEN** the process detail page restores the `Duplicar` menu presentation
- **THEN** the page keeps the existing route and data behavior for document actions without introducing a new duplication workflow as part of this change