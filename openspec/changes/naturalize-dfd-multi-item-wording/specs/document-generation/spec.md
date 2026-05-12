## ADDED Requirements

### Requirement: Multi-item DFD prompts MUST reinforce natural concrete wording
The system MUST assemble DFD generation prompts so that, when object consolidation is `multi_item`, the prompt reinforces natural, concrete, and source-grounded wording for DFD object and requirements. This guidance MUST preserve existing multi-item aggregation and quantity-suppression rules.

#### Scenario: Prompt guides natural wording for concrete item groups
- **WHEN** a DFD prompt is assembled for a multi-item source containing concrete groups such as recipientes, kits, embalagens, fitas, or materiais auxiliares
- **THEN** the prompt keeps those concrete groups visible for drafting
- **AND** it guides the model to prefer those terms over artificial abstractions when drafting the DFD

#### Scenario: Prompt discourages unsupported operational enrichment
- **WHEN** a DFD prompt is assembled for a multi-item source without explicit hygiene, protection, or specific safety context
- **THEN** the prompt guides the model not to add unsupported operational conditions such as higienização, proteção técnica, segurança ampliada, or secure handling
- **AND** it keeps the DFD language administrative and proportional

#### Scenario: Prompt preserves prior multi-item safeguards
- **WHEN** a DFD prompt is assembled for a multi-item source
- **THEN** the prompt continues to direct the model not to mention individual item quantity, unit, lot, value, or full item specification in the DFD object or essential requirements
- **AND** it continues to use the consolidated item groups rather than the first item as the whole object

#### Scenario: Unitary DFD prompts are unaffected
- **WHEN** a DFD prompt is assembled for a unitary object
- **THEN** the multi-item naturalness guidance does not force aggregated item-group wording
- **AND** existing unitary DFD behavior remains available
