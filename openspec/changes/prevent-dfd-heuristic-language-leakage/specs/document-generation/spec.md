## ADDED Requirements

### Requirement: DFD prompts MUST use document-facing object context
The system MUST assemble DFD generation prompts using a DFD-safe object context that presents the results of object interpretation with document-facing labels and values. The DFD prompt MUST NOT expose internal consolidation labels or rationale as drafting material.

#### Scenario: Multi-item DFD prompt hides internal consolidation labels
- **WHEN** a DFD prompt is assembled for a source request classified internally as multi-item
- **THEN** the DFD prompt includes document-facing object context such as materials to mention and suggested administrative object wording
- **AND** it does not expose prompt labels such as "Item dominante da origem", "Orientação de consolidação do objeto", "Racional da consolidação", or "Grupos de itens identificados"

#### Scenario: Multi-item DFD prompt keeps useful concrete materials
- **WHEN** a DFD prompt is assembled for a multi-item acquisition with concrete materials such as recipientes, kits, embalagens, fitas, or materiais auxiliares
- **THEN** the DFD-safe object context keeps those concrete materials visible for drafting
- **AND** it does so without describing the internal grouping or consolidation process

#### Scenario: DFD prompt preserves prior multi-item safeguards
- **WHEN** a DFD prompt is assembled for a multi-item source
- **THEN** the prompt continues to direct the model not to mention individual quantity, unit, lot, value, or full item specification in the DFD object or essential requirements
- **AND** it continues to avoid first-item bias and unsupported generic substitution

#### Scenario: Non-DFD prompts remain unchanged
- **WHEN** ETP, TR, or Minuta prompts are assembled from the same process context
- **THEN** this DFD-safe prompt adaptation does not require those prompt formats to change
- **AND** their existing object consolidation context behavior remains available

### Requirement: Generated DFD text MUST not describe generator reasoning
The system MUST guide DFD generation so the final DFD presents only document-facing administrative content. The generated DFD MUST NOT explain the generator's internal object interpretation, consolidation decisions, grouping process, or editorial safeguards.

#### Scenario: DFD final text avoids heuristic explanation
- **WHEN** the model generates a DFD for a multi-item acquisition
- **THEN** the final document avoids expressions that explain internal reasoning, such as "item dominante", "categoria genérica", "agrupamento", "consolidação", "grupos identificados", "abstração", "agrupamento semântico", "redução do objeto", "itens correlatos identificados", or "estrutura consolidada"
- **AND** it instead states the administrative object and need directly

#### Scenario: DFD may naturally describe materials as a set
- **WHEN** the DFD needs to describe a composite acquisition
- **THEN** it may use natural administrative phrases such as "conjunto dos materiais previstos", "materiais necessários à ação", or concrete item group names
- **AND** it does not justify that wording by referring to the system's consolidation or grouping choices
