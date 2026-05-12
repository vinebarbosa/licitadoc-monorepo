## ADDED Requirements

### Requirement: Document generation MUST prefer reviewed SD item lists over singular item metadata
When a process contains reviewed Solicitação de Despesa item rows in `sourceMetadata.extractedFields.items`, the system MUST use that list as the primary item evidence for DFD, ETP, TR, and Minuta generation. Legacy singular item metadata MUST remain available only as fallback when the reviewed list is absent, empty, or unusable.

#### Scenario: Generation context contains multiple reviewed SD items
- **WHEN** an authorized actor requests generation for a process whose source metadata contains two or more reviewed item rows in `sourceMetadata.extractedFields.items`
- **THEN** the generated provider input includes a concise item-list context containing all reviewed rows
- **AND** the provider input does not present the first item as the sole item description for the SD

#### Scenario: Generation context contains one reviewed SD item
- **WHEN** an authorized actor requests generation for a process whose source metadata contains exactly one reviewed item row in `sourceMetadata.extractedFields.items`
- **THEN** the generated provider input treats the one row as a one-element item list
- **AND** generation follows the same item-list path used for multi-item SDs

#### Scenario: Generation context uses legacy fallback without reviewed items
- **WHEN** an authorized actor requests generation for a process whose source metadata does not contain usable `sourceMetadata.extractedFields.items`
- **THEN** the generated provider input uses legacy singular item metadata such as `sourceMetadata.extractedFields.item` or `itemDescription` when available
- **AND** generation remains valid for older processes created before reviewed item lists existed

#### Scenario: Item-based inference considers the reviewed item list
- **WHEN** document generation derives internal analysis or contracting emphasis from SD item evidence
- **THEN** the system considers the reviewed item list as a whole when it is available
- **AND** the system does not base that inference only on the first reviewed item
