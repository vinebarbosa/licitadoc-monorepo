## ADDED Requirements

### Requirement: Processes listing page MUST preserve the validated operational layout
The web app MUST expose a protected processes listing page at `/app/processos` that preserves the operational structure validated in `tmp/processos.tsx`, including page title, supporting copy, primary new-process action, compact filters, process table, status badges, document progress dots, and last-update column.

#### Scenario: Authenticated user opens the processes page with data
- **WHEN** an authenticated actor opens `/app/processos` and the process query returns items
- **THEN** the page renders the validated information architecture from `tmp/processos.tsx`
- **THEN** the page displays process number, name or object, status, type, responsible, document progress, and last update for each returned item

#### Scenario: Processes page is composed inside the app shell
- **WHEN** an authenticated actor opens `/app/processos`
- **THEN** the page renders inside the authenticated app shell with the sidebar and breadcrumb context for `Central de Trabalho` and `Processos`
- **THEN** the sidebar Processos item is reachable from the authenticated navigation

### Requirement: Processes listing page MUST use real API data and URL-driven controls
The processes listing page MUST use the generated API client through a module-level processes adapter and MUST NOT render mock rows from `tmp/processos.tsx`. Search, status filter, type filter, and pagination MUST be represented in the URL and MUST drive the backend process listing request.

#### Scenario: User changes search or filters
- **WHEN** an authenticated actor changes the search text, status filter, type filter, or pagination on `/app/processos`
- **THEN** the page updates the URL state for the selected controls
- **THEN** the page requests `GET /api/processes` with corresponding query params through the module API adapter

#### Scenario: User restores listing from URL
- **WHEN** an authenticated actor opens `/app/processos` with existing query params for search, status, type, or page
- **THEN** the controls restore those values from the URL
- **THEN** the rendered table reflects the restored process listing response

### Requirement: Processes listing page MUST render resilient loading, empty, and error states
The processes listing page MUST keep the validated table-oriented layout during loading, empty, and error states. The page MUST avoid falling back to mock process rows when the backend is loading, empty, or unavailable.

#### Scenario: Process listing is loading
- **WHEN** the process listing request is pending
- **THEN** the page renders loading placeholders in the table area while preserving the header and filters

#### Scenario: Active filters return no processes
- **WHEN** the process listing request succeeds with zero items
- **THEN** the page renders an empty state in the table area
- **THEN** the page keeps the active filters visible for adjustment

#### Scenario: Process listing request fails
- **WHEN** the process listing request fails
- **THEN** the page renders an error state with a retry affordance
- **THEN** the page does not render mock data

### Requirement: Processes listing page MUST map backend document progress to the validated visual indicator
The processes listing page MUST render the backend document summary as the compact progress indicator validated in `tmp/processos.tsx`. The number of dots MUST equal `documents.totalRequiredCount`, completed dots MUST equal `documents.completedCount`, and the textual fraction MUST match the same values.

#### Scenario: Listed process has partial document progress
- **WHEN** a listed process returns `documents.completedCount = 2` and `documents.totalRequiredCount = 4`
- **THEN** the page renders four document progress dots
- **THEN** the first two dots are styled as completed and the remaining two as incomplete
- **THEN** the page renders the progress text `2/4`
