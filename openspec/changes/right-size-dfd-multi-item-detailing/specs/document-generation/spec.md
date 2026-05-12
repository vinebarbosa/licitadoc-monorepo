## ADDED Requirements

### Requirement: DFD multi-item prompts MUST de-emphasize individual item details
The system MUST assemble DFD generation prompts so that, when object consolidation is `multi_item`, individual first-item quantity, unit, lot, item value, and detailed item specification are not treated as drafting anchors for the DFD object or essential requirements.

#### Scenario: Multi-item DFD prompt warns against first-item quantity leakage
- **WHEN** a DFD prompt is assembled for a source request classified as `multi_item`
- **AND** the source metadata includes first-item quantity, unit, or detailed item description
- **THEN** the prompt includes guidance not to mention individual item quantity, unit, lot, value, or full item specification in the DFD object or essential requirements
- **AND** the prompt directs the model to describe the acquisition as aggregated item groups

#### Scenario: Multi-item DFD keeps aggregated groups visible
- **WHEN** a DFD prompt is assembled for a multi-item acquisition with consolidated object groups
- **THEN** the prompt keeps the consolidated item groups available for object wording
- **AND** it avoids emphasizing the first item as the total scope of the demand

#### Scenario: Unitary DFD remains specific
- **WHEN** a DFD prompt is assembled for a unitary object
- **THEN** the prompt does not apply the multi-item quantity suppression rule
- **AND** existing unitary object behavior remains available for direct description
