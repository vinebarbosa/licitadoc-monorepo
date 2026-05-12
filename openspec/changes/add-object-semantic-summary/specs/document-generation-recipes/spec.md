## ADDED Requirements

### Requirement: Recipes MUST treat objectSemanticSummary as authoritative object context
The repository-managed recipes for `dfd`, `etp`, `tr`, and `minuta` MUST instruct the model to use the provided `objectSemanticSummary` as the base interpretation of the contracting object. Recipes MUST NOT instruct the model to reinterpret SD item lists independently when the semantic summary is available.

#### Scenario: DFD uses the summary for administrative object description
- **WHEN** DFD generation context includes `objectSemanticSummary`
- **THEN** the DFD recipe instructs the model to describe the object administratively using the summary label and primary groups
- **AND** it keeps the description proportional to initial demand formalization

#### Scenario: ETP uses the summary for technical analysis
- **WHEN** ETP generation context includes `objectSemanticSummary`
- **THEN** the ETP recipe instructs the model to analyze the solution using the same object type, purpose, and primary groups
- **AND** it does not substitute a different item grouping during analysis

#### Scenario: TR uses the summary for operationalization
- **WHEN** TR generation context includes `objectSemanticSummary`
- **THEN** the TR recipe instructs the model to structure execution, delivery, conformity, receipt, and fiscalization around the provided primary groups and detail flags
- **AND** it does not narrow the TR to the first item or broaden it to unsupported generic categories

#### Scenario: Minuta uses the summary for contractual object scope
- **WHEN** Minuta generation context includes `objectSemanticSummary`
- **THEN** the Minuta recipe instructs the model to formalize the object scope using the provided summary label and primary groups
- **AND** it preserves the same semantic scope used by DFD, ETP, and TR

### Requirement: Recipes MUST avoid unsupported generic labels and item-level over-detail
The recipes MUST instruct generated documents to preserve concrete material groups from `objectSemanticSummary`, avoid artificial broad categories, and follow `shouldAvoidItemLevelDetail` and `shouldAvoidQuantitativeMention` flags for high-level object wording.

#### Scenario: Generic category is rejected without semantic support
- **WHEN** `objectSemanticSummary` provides concrete groups such as recipientes plásticos, kits compostos, embalagens, and materiais auxiliares de acondicionamento
- **THEN** the recipes instruct the model not to replace those groups with labels such as "materiais de apoio", "insumos operacionais", "componentes logísticos", "estrutura consolidada", "grupos correlatos", or "itens dominantes" unless those labels are explicitly supported by the summary/source evidence

#### Scenario: Detail flags control item-level wording
- **WHEN** `objectSemanticSummary.shouldAvoidItemLevelDetail` or `objectSemanticSummary.shouldAvoidQuantitativeMention` is true
- **THEN** the recipes instruct the model to avoid item-by-item specifications, quantities, units, lots, and values in high-level object descriptions
- **AND** the recipes allow those details only where the target document section naturally requires later technical or contractual detailing and the source context supports it

### Requirement: Recipes MUST avoid semantic-layer heuristic leakage
The recipes MUST prohibit final documents from explaining how the system grouped, consolidated, or selected item evidence. Generated documents MUST use the semantic summary as context, not narrate the summary-building process.

#### Scenario: Final prose does not mention interpretation mechanics
- **WHEN** any supported document is generated from a semantic summary
- **THEN** the recipe instructs the model not to mention internal terms such as item dominante, racional da consolidação, heurística, agrupamento automático, or estrutura consolidada
- **AND** the final prose remains focused on the contracting object rather than on the system's interpretation process
