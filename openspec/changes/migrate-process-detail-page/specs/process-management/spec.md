## ADDED Requirements

### Requirement: Process detail API MUST expose view model data for the detail page
The process detail read MUST return the existing stored process profile plus the resolved data needed by the web process detail page. The enriched response MUST include linked departments, an estimated value when derivable from process metadata, and document cards for the required procurement document types.

#### Scenario: Detail response includes resolved departments
- **WHEN** an authorized actor reads a process detail
- **THEN** the response includes the existing `departmentIds`
- **AND** it includes a `departments` array with each linked department id, name, nullable budget unit code, organization id, and display label

#### Scenario: Detail response includes estimated value
- **WHEN** the process has source metadata containing a total or item total value from an imported SD
- **THEN** the response includes an `estimatedValue` suitable for display on the process detail page
- **AND** when no estimated value is available, the response includes `estimatedValue: null`

#### Scenario: Detail response includes required document cards
- **WHEN** an authorized actor reads a process detail
- **THEN** the response includes exactly one document card for each required type `dfd`, `etp`, `tr`, and `minuta`
- **AND** each card includes type, label, title, description, UI status, nullable document id, nullable last update, nullable progress, and action availability data needed by the frontend

#### Scenario: Existing documents map to card statuses
- **WHEN** documents exist for a process
- **THEN** `completed` documents map to `concluido`
- **AND** `generating` documents map to `em_edicao`
- **AND** `failed` documents map to `erro`
- **AND** missing required document types map to `pendente`

#### Scenario: Detail visibility remains scoped
- **WHEN** an actor without visibility over the process organization requests the enriched detail
- **THEN** the system rejects the request using the existing process detail visibility rules

#### Scenario: Existing profile fields remain available
- **WHEN** a caller reads the enriched process detail
- **THEN** all fields from the existing process profile response remain available with compatible names and value types
