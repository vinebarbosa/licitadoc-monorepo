## ADDED Requirements

### Requirement: Process detail reads MUST expose display-ready detail context
The system MUST return process detail data that is sufficient for the protected detail page to render process identity, institutional context, native items, summary values, control dates, and required document cards without additional API requests.

#### Scenario: Reading process detail returns institutional context
- **WHEN** an authorized actor requests a process by id
- **THEN** the response includes compact organization context with the process organization id and display name
- **AND** the response includes department display labels for all linked departments

#### Scenario: Reading process detail returns native item summary
- **WHEN** an authorized actor requests a process by id for a process with stored items
- **THEN** the response includes native process items, kit components, item count, component count, and estimated total value derived from stored item totals

#### Scenario: Reading process detail returns required document cards
- **WHEN** an authorized actor requests a process by id
- **THEN** the response includes DFD, ETP, TR, and Minuta card metadata with status, latest document id when present, last update date, progress when known, and available create/edit/view actions
