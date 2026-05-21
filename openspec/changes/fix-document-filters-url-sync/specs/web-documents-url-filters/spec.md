## ADDED Requirements

### Requirement: Documents filters MUST be restored from URL query parameters
The documents listing page MUST derive its visible filter controls and filtered result set from the current route query parameters. The page MUST support `tipo`, `status`, and `search` query parameters, normalize missing or invalid values to default filters, and keep `/app/documentos` usable without query parameters.

#### Scenario: Type filter deep link opens with matching control
- **WHEN** an authenticated actor navigates to `/app/documentos?tipo=tr`
- **THEN** the documents page type filter shows `TR`
- **AND** the visible document rows are filtered to documents whose type is `tr`

#### Scenario: Status and search deep link opens with matching controls
- **WHEN** an authenticated actor navigates to `/app/documentos?status=em_edicao&search=termo`
- **THEN** the documents page status filter shows `Em edicao`
- **AND** the search field value is `termo`
- **AND** the visible document rows match both filters

#### Scenario: Invalid query values use defaults
- **WHEN** an authenticated actor navigates to `/app/documentos?tipo=invalido&status=invalido`
- **THEN** the type filter shows `Todos`
- **AND** the status filter shows `Todos`
- **AND** the page renders without a select value error

### Requirement: Documents page filter changes MUST update the URL
The documents listing page MUST write user changes from the search, type, and status controls back to the route query string. Default filter values MUST be omitted from the query string so the canonical unfiltered route remains `/app/documentos`.

#### Scenario: User selects a document type
- **WHEN** an authenticated actor selects `ETP` in the documents page type filter
- **THEN** the route query string contains `tipo=etp`
- **AND** the visible document rows are filtered to documents whose type is `etp`

#### Scenario: User selects a status
- **WHEN** an authenticated actor selects `Em edicao` in the documents page status filter
- **THEN** the route query string contains `status=em_edicao`
- **AND** the visible document rows are filtered to documents whose displayed status is `em_edicao`

#### Scenario: User clears filters back to defaults
- **WHEN** an authenticated actor changes type and status filters back to `Todos` and clears the search field
- **THEN** the route is `/app/documentos` without `tipo`, `status`, or `search` parameters
- **AND** the visible document rows are no longer constrained by those filters

### Requirement: Sidebar document type links MUST drive the documents page filters
The app sidebar document type links MUST remain normal route links to `/app/documentos?tipo=<documentType>`, and the documents page MUST react to those route changes even when it is already mounted.

#### Scenario: Sidebar click changes an already-mounted documents page
- **WHEN** an authenticated actor is viewing `/app/documentos?tipo=tr`
- **AND** the actor activates the sidebar `ETP` link
- **THEN** the route becomes `/app/documentos?tipo=etp`
- **AND** the documents page type filter shows `ETP`
- **AND** the visible document rows are filtered to documents whose type is `etp`

#### Scenario: Browser navigation restores prior document filters
- **WHEN** an authenticated actor visits `/app/documentos?tipo=dfd`, then `/app/documentos?tipo=minuta`
- **AND** the actor uses browser back navigation
- **THEN** the route returns to `/app/documentos?tipo=dfd`
- **AND** the documents page type filter shows `DFD`
