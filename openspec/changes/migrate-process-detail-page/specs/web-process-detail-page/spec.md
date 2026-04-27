## ADDED Requirements

### Requirement: Process detail page uses the validated legacy UI
The web app MUST provide a protected process detail page at `/app/processo/:processId` that migrates the validated UI from `tmp/processo.tsx` into the new frontend architecture without redesigning the visual composition.

#### Scenario: Detail route renders migrated layout
- **WHEN** an authenticated user opens `/app/processo/:processId` for a visible process
- **THEN** the page renders inside the current app shell
- **AND** it shows the same primary sections as the legacy UI: process header, process information card, and "Documentos do Processo" grid
- **AND** it does not rely on mock process data from `tmp/processo.tsx`

#### Scenario: Header preserves validated composition
- **WHEN** the process detail data loads
- **THEN** the header shows process object/name, status badge, process number, process type, department label, and the `Visualizar` and `Editar` outline actions in the same hierarchy as the legacy UI

#### Scenario: Summary card preserves validated composition
- **WHEN** the process detail data loads
- **THEN** the summary card shows responsible person, estimated value, created date, last update date, and description/object using the same visual structure as the legacy UI

### Requirement: Process detail page consumes API data
The process detail page MUST load process detail data from the API and handle loading, error, forbidden, and missing states.

#### Scenario: Page loads process detail from API
- **WHEN** the route has a `processId`
- **THEN** the page requests the corresponding process detail through the process module API layer
- **AND** it renders the returned process and document data rather than local constants

#### Scenario: Detail request is loading
- **WHEN** the process detail request is pending
- **THEN** the page shows a loading state that preserves the expected page structure enough to avoid layout jumps

#### Scenario: Detail request fails
- **WHEN** the process detail request fails or returns not found/forbidden
- **THEN** the page shows a recoverable error or not-found state with navigation back to the processes list

### Requirement: Document grid reflects required process documents
The process detail page MUST show cards for DFD, ETP, TR, and Minuta using API-provided status, dates, progress, and document identifiers.

#### Scenario: Existing completed document
- **WHEN** the process detail response contains a completed DFD document
- **THEN** the DFD card shows the completed badge, last update, and `Editar` and `Visualizar` actions

#### Scenario: Existing in-progress document
- **WHEN** the process detail response contains an in-progress ETP document with progress
- **THEN** the ETP card shows the in-editing badge, progress bar, last update, and `Editar` and `Visualizar` actions

#### Scenario: Missing required document
- **WHEN** the process detail response marks TR or Minuta as pending
- **THEN** the corresponding card shows the pending badge and a `Criar` action linked to document creation for that process and document type

#### Scenario: Failed document
- **WHEN** the process detail response contains a failed required document
- **THEN** the corresponding card shows the error badge and still exposes available actions for inspection or retry-oriented navigation

### Requirement: Navigation integrates with current process module
The process detail page MUST be reachable from the process listing and registered in the current route architecture.

#### Scenario: Listing navigates to detail
- **WHEN** the user activates a process row or process number in the listing
- **THEN** the user navigates to `/app/processo/:processId`

#### Scenario: Detail breadcrumbs include process number
- **WHEN** the process detail route is active and data is available
- **THEN** breadcrumbs identify `Central de Trabalho`, `Processos`, and the process number or a stable fallback while loading
