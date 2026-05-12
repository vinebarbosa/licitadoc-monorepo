## ADDED Requirements

### Requirement: Multi-item object consolidation MUST preserve source item-group fidelity
The system MUST consolidate multi-item contracting objects using the concrete material groups that are present in process source context. The consolidated object MUST avoid replacing source-grounded item groups with broader generic categories unless those categories are explicitly present or clearly supported by the source request.

#### Scenario: Composite object preserves concrete SD groups
- **WHEN** source context includes concrete item groups such as potes, kits, embalagens, fitas, or materiais auxiliares
- **THEN** the generation context exposes `multi_item` consolidation
- **AND** the identified groups preserve those concrete material groups or close lexical equivalents
- **AND** the consolidated object does not replace them with an unsupported category such as "materiais de apoio a eventos"

#### Scenario: Contextual purpose does not become an item group
- **WHEN** source context includes an administrative purpose such as distribution, festivity, commemorative action, or event
- **AND** the concrete items are materials such as recipients, kits, packaging, ribbons, accessories, or auxiliary items
- **THEN** the purpose may remain available as context
- **AND** the item groups and consolidated object remain based on the concrete material items
- **AND** the system MUST NOT create a display group solely from the purpose text

#### Scenario: Explicit generic categories remain allowed
- **WHEN** the source object or item text explicitly uses a generic category such as "materiais diversos", "insumos", or "materiais de apoio"
- **THEN** the consolidated object may include that category
- **AND** it still preserves any concrete item groups that are also present

#### Scenario: Unitary objects remain unchanged
- **WHEN** the process represents a unitary object without reliable multi-item signals
- **THEN** the generation context preserves unitary consolidation behavior
- **AND** it does not introduce concrete or generic item groups absent from source context

### Requirement: Consolidated object prompt fields MUST distinguish concrete groups from guidance context
The system MUST expose prompt fields that make clear which item groups were identified from source material and which text is only consolidation guidance or contextual purpose.

#### Scenario: Prompt exposes concrete item groups
- **WHEN** a prompt is assembled for `dfd`, `etp`, `tr`, or `minuta` from a multi-item source context
- **THEN** the prompt includes concrete identified item groups
- **AND** the suggested consolidated object uses those groups rather than broad unsupported categories
- **AND** the guidance warns against replacing concrete items with artificial category-mother labels
