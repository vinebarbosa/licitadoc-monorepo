## ADDED Requirements

### Requirement: Authenticated home page MUST render the validated Central de Trabalho layout
The system MUST render the authenticated `/app` home page using the validated Central de Trabalho layout from `tmp/dashboard.tsx`, adapted only to the current app shell and shared UI architecture.

#### Scenario: User opens the authenticated home page
- **WHEN** an authenticated user navigates to `/app`
- **THEN** the page displays the "Central de Trabalho" title and "Gerencie seus processos de contratacao e documentos" description
- **AND** the page displays a "Novo Processo" action linking to `/app/processo/novo`
- **AND** the page does not render an empty placeholder main area

### Requirement: Home page MUST expose validated quick document actions
The home page MUST display the validated quick action cards for creating DFD, ETP, TR, and Minuta documents.

#### Scenario: User scans quick actions
- **WHEN** an authenticated user views the "Acoes Rapidas" section
- **THEN** the page shows actions for "Criar DFD", "Criar ETP", "Criar TR", and "Criar Minuta"
- **AND** each action links to `/app/documento/novo` with the corresponding `tipo` query parameter

### Requirement: Home page MUST keep resume work as mocked content
The home page MUST keep the "Continuar de onde parei" section visible using local mocked data until a real resume-work contract exists.

#### Scenario: User views the resume work section
- **WHEN** an authenticated user views "Continuar de onde parei"
- **THEN** the page displays mocked in-progress document cards with document type, name, process reference, last edited text, progress bar, and "Continuar" action
- **AND** these cards are not sourced from the process or documents API

### Requirement: Home page MUST show API-backed recent processes
The home page MUST render the "Processos de Contratacao" table from the existing process listing API rather than hard-coded process rows.

#### Scenario: Process API returns process rows
- **WHEN** `GET /api/processes` returns process items for the home page
- **THEN** the table displays process number, name/object, status, type, document progress, and latest update for each returned process
- **AND** each process number and name links to the process detail route

#### Scenario: Process API is loading
- **WHEN** the process list request is pending
- **THEN** the home page displays a loading state in the processes area without rendering mock process rows

#### Scenario: Process API returns no rows
- **WHEN** the process list request succeeds with no process items
- **THEN** the home page displays an empty state in the processes area without rendering mock process rows

#### Scenario: Process API fails
- **WHEN** the process list request fails
- **THEN** the home page displays an error state with an affordance to retry the process request
- **AND** quick actions and mocked resume cards remain visible
