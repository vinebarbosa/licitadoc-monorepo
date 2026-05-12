## ADDED Requirements

### Requirement: Native expense request process creation MUST use a multi-step wizard

The web process creation page SHALL guide authenticated users through a multi-step native Solicitação de Despesa workflow before creating a process.

#### Scenario: User opens the process creation wizard
- **WHEN** an authenticated user opens the process creation page
- **THEN** the page displays a step-based creation flow
- **AND** the flow includes steps for request/process data, organization and department links, items, and final review

#### Scenario: Required step data is missing
- **WHEN** the user attempts to advance from a step with missing required fields
- **THEN** the wizard keeps the user on the current step
- **AND** the wizard shows field-level or step-level validation messages for the missing data

#### Scenario: User navigates backward
- **WHEN** the user navigates from a later step back to an earlier step
- **THEN** the wizard preserves already entered process, link, item, kit, and component data

#### Scenario: Reference data cannot be loaded
- **WHEN** organization or department reference data required by the current actor cannot be loaded
- **THEN** the wizard prevents submission
- **AND** the wizard displays a recoverable error state or retry action

### Requirement: Native expense request item builder MUST support simple items and kits

The web process creation wizard SHALL allow users to create structured solicitation items without encoding kits as one long mixed description.

#### Scenario: User adds a simple item
- **WHEN** the user adds a simple item
- **THEN** the item editor captures title or description, quantity, unit, unit value, and total value when available
- **AND** the item is included in the wizard review

#### Scenario: User adds a kit item
- **WHEN** the user adds a kit item
- **THEN** the item editor captures parent kit title or description, quantity, unit, unit value, and total value when available
- **AND** the item editor allows components to be added beneath the parent kit

#### Scenario: User adds kit components
- **WHEN** the user adds components to a kit
- **THEN** each component captures title or description, quantity, and unit when available
- **AND** the component remains visually associated with its parent kit

#### Scenario: Kit description would otherwise be long
- **WHEN** a kit has multiple component descriptions
- **THEN** the wizard keeps the parent kit description separate from component descriptions
- **AND** the user does not need to combine all component details into a single long item description

#### Scenario: User removes an item or component
- **WHEN** the user removes an item or component from the item step
- **THEN** the wizard removes only that item or component
- **AND** the remaining item and component data is preserved

### Requirement: Native expense request wizard MUST review and submit canonical metadata

The web process creation wizard SHALL submit a regular process creation request whose source metadata preserves the native solicitation item structure.

#### Scenario: User reviews before submitting
- **WHEN** the user reaches the final review step
- **THEN** the wizard displays the process data, organization/department links, simple items, kits, components, and available totals before submission

#### Scenario: User submits native form data
- **WHEN** the user submits a valid native expense request form
- **THEN** the wizard sends a process creation request with the entered process profile and department ids
- **AND** the request marks the source as an expense request created by native form input
- **AND** the request includes normalized simple items and kit items in `sourceMetadata.extractedFields.items`

#### Scenario: Submitted item is a kit
- **WHEN** a submitted item is a kit with components
- **THEN** the normalized metadata preserves the parent kit fields
- **AND** the normalized metadata preserves each component title or description, quantity, and unit beneath the parent item

#### Scenario: Submission succeeds
- **WHEN** the process creation request succeeds
- **THEN** the user is redirected to the created process detail page
- **AND** the created process can show the submitted items through its source metadata

#### Scenario: Submission fails
- **WHEN** the process creation request fails
- **THEN** the wizard keeps the entered data in place
- **AND** the wizard displays the server error without resetting the current step

### Requirement: PDF import MUST map into the native wizard structure when used

If PDF import remains available in the process creation page, it SHALL act as an assistive prefill mechanism for the native wizard rather than a separate competing form shape.

#### Scenario: PDF import extracts flat item rows
- **WHEN** PDF import returns flat item rows without component metadata
- **THEN** the wizard maps those rows into native simple items
- **AND** the user can edit the mapped items before review and submission

#### Scenario: PDF import fails or is cancelled
- **WHEN** PDF import fails or the user cancels applying the import
- **THEN** the wizard preserves the native form data that was already entered manually
