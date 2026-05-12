## ADDED Requirements

### Requirement: Process creation MUST preserve reviewed SD item metadata
The process creation workflow MUST accept reviewed Solicitação de Despesa item rows submitted through `sourceMetadata` and MUST persist them with the created process without requiring a normalized item table.

#### Scenario: Imported process metadata contains reviewed item rows
- **WHEN** an authorized actor creates a process with `sourceMetadata.extractedFields.items`
- **THEN** the created process persists the item list in `sourceMetadata.extractedFields.items`
- **AND** reading the process detail returns the persisted item metadata

#### Scenario: Reviewed item metadata remains compatible with singular item consumers
- **WHEN** an authorized actor creates a process with reviewed item rows and a compatibility `sourceMetadata.extractedFields.item`
- **THEN** the created process preserves both the complete `items` list and the singular `item` value

#### Scenario: Creation without reviewed items remains valid
- **WHEN** an authorized actor creates a process without `sourceMetadata.extractedFields.items`
- **THEN** process creation remains valid when all existing required process fields are present
- **AND** the system does not fabricate item rows
