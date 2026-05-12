## ADDED Requirements

### Requirement: Process creation MUST preserve native expense request item structures

The system MUST preserve structured native Solicitação de Despesa item metadata submitted during process creation so the created process can be reviewed and used as downstream document-generation context.

#### Scenario: Native simple items are submitted
- **WHEN** an authenticated actor creates a process with native expense request metadata containing simple item rows
- **THEN** the created process persists those rows in source metadata
- **AND** the process detail response exposes the same simple item title or description, quantity, unit, unit value, and total value fields when available

#### Scenario: Native kit items are submitted
- **WHEN** an authenticated actor creates a process with native expense request metadata containing a kit item with components
- **THEN** the created process persists the parent kit item fields in source metadata
- **AND** the process detail response exposes the kit components beneath the parent item with component title or description, quantity, and unit when available

#### Scenario: Native form source marker is submitted
- **WHEN** an authenticated actor creates a process from the native expense request wizard
- **THEN** the created process persists source traceability identifying the input mode as native form input
- **AND** the created process remains scoped by the same organization and department rules as regular process creation

#### Scenario: Existing imported process metadata is read
- **WHEN** an authorized actor reads a process created before native kit metadata existed
- **THEN** the process read preserves the existing source metadata shape without requiring a migration
