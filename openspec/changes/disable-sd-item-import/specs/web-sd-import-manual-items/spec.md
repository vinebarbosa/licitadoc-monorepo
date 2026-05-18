## ADDED Requirements

### Requirement: SD import MUST NOT populate process items
The web SD import flow MUST apply only process-level and linkage data from a Solicitação de Despesa. It MUST NOT create, replace, or remove process item rows when the user applies the SD extraction.

#### Scenario: Applying SD to an empty item list
- **WHEN** the user applies a readable SD extraction to a process form with no items
- **THEN** the process basics and institutional links may be populated from the SD
- **AND** the process item list remains empty

#### Scenario: Applying SD after manual items exist
- **WHEN** the user has manually added one or more process items before applying an SD extraction
- **THEN** the existing manual items remain unchanged
- **AND** no additional items are created from SD item rows

#### Scenario: Reapplying another SD preserves manual items
- **WHEN** the user applies one SD extraction and later applies another SD extraction
- **THEN** the process item list remains the manually entered list from before the reapplication
- **AND** extracted item rows from either SD are not inserted into the wizard

### Requirement: SD import preview MUST communicate manual item entry
The SD import preview and applied summary MUST NOT imply that item rows from the SD will be imported into the process item step.

#### Scenario: Preview detects SD item rows
- **WHEN** a readable SD contains item rows
- **THEN** the preview may mention that item rows were detected
- **AND** the preview indicates that process items will be inserted manually

#### Scenario: Submit after SD import without manual items
- **WHEN** the user applies SD data and submits without adding process items manually
- **THEN** the submitted manual process payload contains no item rows

#### Scenario: Submit after SD import with manual items
- **WHEN** the user applies SD data, manually adds process items, and submits
- **THEN** the submitted manual process payload contains only the manually entered items
