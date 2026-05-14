## ADDED Requirements

### Requirement: Authenticated process edit MUST reuse the validated process form flow
The web app MUST provide a protected process edit page at `/app/processo/:processId/editar` that reuses the authenticated process creation wizard as its visual and interaction baseline. The edit flow MUST preserve the same step structure, core field controls, item editing surface, and review stage while prefilling the form from the persisted process data returned by the API.

#### Scenario: Visible process opens in the edit wizard
- **WHEN** an authenticated actor with visibility over a process opens `/app/processo/:processId/editar`
- **THEN** the page loads the current process from the API
- **AND** it prefills the wizard with the stored process fields, linked departments, and persisted items

#### Scenario: Edit flow keeps organization as fixed context
- **WHEN** an authenticated actor edits a process
- **THEN** the page shows the process organization as reference data for the wizard context
- **AND** it does not allow switching the process to a different organization from that page

#### Scenario: Edit route cannot load the target process
- **WHEN** the edit page receives a missing, forbidden, or otherwise unreadable `processId`
- **THEN** the page shows a recoverable failure or not-found state with navigation back to the process list or detail flow

### Requirement: Authenticated process edit MUST persist changes through the existing update API
The process edit page MUST submit user changes through the existing process update contract and MUST keep the user inside the wizard when validation or API errors happen. The submitted payload MUST reflect the editable process fields represented in the wizard, including trimmed text values, selected departments, and structured items.

#### Scenario: User saves edited process data
- **WHEN** the user updates process data in the wizard and confirms the save action
- **THEN** the page sends the canonical process update payload to the API for that `processId`
- **AND** after a successful response the user is navigated back to the process detail page

#### Scenario: Update API rejects the edit
- **WHEN** the process update API returns an error for the submitted edit
- **THEN** the page keeps the user in the edit wizard
- **AND** it shows the returned error in the form context without discarding the typed changes

#### Scenario: Required edit fields are missing
- **WHEN** the user attempts to advance or save with missing required process data
- **THEN** the page shows validation feedback in the same wizard context used by the process creation flow

### Requirement: Process edit route MUST integrate with current process navigation
The process edit page MUST be registered in the protected app router and MUST be reachable from existing process navigation affordances.

#### Scenario: Detail page edit action reaches the edit route
- **WHEN** the user activates the `Editar` action from the process detail header
- **THEN** the app navigates to `/app/processo/:processId/editar`

#### Scenario: Edit page keeps app-shell navigation context
- **WHEN** the edit route is active
- **THEN** the page renders inside the current protected app shell
- **AND** breadcrumbs identify `Central de Trabalho`, `Processos`, and the process edit context
