## ADDED Requirements

### Requirement: DFD recipe MUST keep multi-item acquisitions administrative and aggregated
The repository-managed DFD recipe MUST instruct the model that, for multi-item, kit, accessory, packaging, auxiliary-material, or composite acquisitions, the DFD object and essential requirements remain administrative and aggregated. The recipe MUST prohibit item-level quantity, unit, lot, value, and complete technical specification details in those DFD sections.

#### Scenario: DFD object avoids individual first item detail
- **WHEN** DFD generation context indicates `multi_item` consolidation
- **AND** the source contains first-item detail such as quantity or specific capacity
- **THEN** the DFD recipe instructs the model not to describe the object as that first item with its quantity or specification
- **AND** it instructs the model to use the consolidated item groups faithfully

#### Scenario: DFD essential requirements remain group-level
- **WHEN** DFD generation context indicates `multi_item` consolidation
- **THEN** the DFD recipe instructs the model to write essential requirements as broad administrative requirements for the material groups
- **AND** it prohibits requirements such as "fornecimento de 550 unidades", item capacity, unit, lot, item value, or full item-by-item specification

#### Scenario: DFD points item detail to subsequent instruments
- **WHEN** multi-item source detail includes quantities, units, line-item composition, or technical specifications
- **THEN** the DFD recipe states that those details belong to the TR, item map, price research, or subsequent instrument
- **AND** the DFD remains limited to demand formalization and aggregated object scope

#### Scenario: Unitary DFD behavior is preserved
- **WHEN** the source request represents a unitary acquisition
- **THEN** the DFD recipe does not force aggregated multi-item wording
- **AND** it may continue to use specific object information compatible with the DFD role
