## ADDED Requirements

### Requirement: Document generation context MUST consolidate multi-item contracting objects
The system MUST detect likely multi-item, kit, accessory, auxiliary-material, or composite acquisition scenarios during document generation context assembly and expose a conservative consolidated object summary to generated document prompts. The consolidated summary MUST remain grounded in stored process data, extracted metadata, or preserved source context and MUST NOT invent item categories or scope.

#### Scenario: Composite acquisition exposes consolidated object context
- **WHEN** a stored process source context contains multiple related items such as potes, kits, embalagens, fitas, materiais auxiliares, acessórios, insumos, or other complementary groups tied to the same administrative purpose
- **THEN** the generation context includes a `multi_item` object consolidation signal
- **AND** it includes the original object or item text
- **AND** it includes a consolidated object summary representing the acquisition as a set
- **AND** it includes representative item groups when they are present in source context

#### Scenario: First item is not treated as the whole object
- **WHEN** a process has a dominant first item and additional complementary items in source metadata or preserved source text
- **THEN** the consolidated object summary does not reduce the contracting object to only the first item
- **AND** document prompts receive guidance to describe the global acquisition scope proportionally

#### Scenario: Unitary acquisition remains specific
- **WHEN** a stored process represents a unitary object such as one notebook, one software service, one artistic presentation, one vehicle, one consulting service, or one specific work
- **THEN** the generation context marks the object as unitary or omits multi-item aggregation guidance
- **AND** it preserves the specific object rather than replacing it with a broad category

#### Scenario: Independent or unsupported items are not over-aggregated
- **WHEN** source context does not provide enough support that listed items are complementary or tied to the same administrative purpose
- **THEN** the system avoids creating unsupported consolidated categories
- **AND** it preserves available source details for human review without inventing a semantic grouping

#### Scenario: Prompt context exposes consolidation fields consistently
- **WHEN** the backend assembles a generation prompt for `dfd`, `etp`, `tr`, or `minuta`
- **THEN** the prompt includes consistent consolidated-object fields such as consolidation type, original object, dominant item, identified item groups, suggested consolidated object, and consolidation guidance when available
- **AND** these fields are absent or explicitly unitary for single-item acquisitions
