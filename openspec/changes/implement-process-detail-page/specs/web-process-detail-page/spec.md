## ADDED Requirements

### Requirement: Protected process detail page MUST use the validated UI with API data
The web app MUST provide a protected process detail page at `/app/processo/:processId` that adopts the validated UI from `apps/web/src/modules/public/pages/process-detail-demo-page.tsx` while rendering API-backed process data.

#### Scenario: Detail route renders validated sections
- **WHEN** an authenticated user opens `/app/processo/:processId` for a visible process
- **THEN** the page renders the process header, executive summary, process information, solicitation items, institutional context, control dates, and "Documentos do Processo" sections
- **AND** the page renders values returned by the process detail API rather than demo constants

#### Scenario: Header exposes primary process identity
- **WHEN** the process detail request succeeds
- **THEN** the header shows the process title, status badge, process number, optional external id, and an edit action for the current process

### Requirement: Process detail page MUST handle loading and failure states
The web app MUST provide stable loading, retryable failure, and not-found states for the process detail route.

#### Scenario: Detail request is loading
- **WHEN** the detail request is pending
- **THEN** the page shows a loading state with the text "Carregando processo..."

#### Scenario: Detail request fails with retryable error
- **WHEN** the detail request fails with a server or network error
- **THEN** the page shows "Não foi possível carregar o processo"
- **AND** it offers "Tentar novamente" and "Voltar para Processos" actions

#### Scenario: Detail request is not visible or missing
- **WHEN** the API returns not found or forbidden for the requested process
- **THEN** the page shows "Processo não encontrado"
- **AND** it offers navigation back to the processes list without a retry action

### Requirement: Process detail page MUST render native solicitation items
The web app MUST render the process `items` returned by the API below the process justification, including simple items and kit components.

#### Scenario: Process has native simple and kit items
- **WHEN** the detail response includes simple items and kit items with components
- **THEN** the item section shows item count, codes, titles, descriptions, quantities, units, unit values, total values, and expandable kit components

#### Scenario: Process has no usable items
- **WHEN** the detail response has no items
- **THEN** the solicitation item section is not rendered

### Requirement: Process detail page MUST expose document actions from API metadata
The web app MUST render one card for each API-provided required document and link available actions to the existing document routes.

#### Scenario: Existing document can be edited and viewed
- **WHEN** a document card has `availableActions.edit` and `availableActions.view` with a `documentId`
- **THEN** the card links to `/app/documento/:documentId` and `/app/documento/:documentId/preview`

#### Scenario: Missing document can be generated
- **WHEN** a document card has `availableActions.create`
- **THEN** the card links to `/app/documento/novo?tipo=<documentType>&processo=<processId>` with the visible action label "Gerar"

#### Scenario: Existing document can be generated again
- **WHEN** a document card has a `documentId`
- **THEN** the card links to `/app/documento/novo?tipo=<documentType>&processo=<processId>` with the visible action label "Gerar novamente"
