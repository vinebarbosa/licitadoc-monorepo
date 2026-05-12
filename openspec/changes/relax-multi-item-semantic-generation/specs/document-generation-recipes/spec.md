## ADDED Requirements

### Requirement: Document recipes MUST use simple item-awareness guidance
Repository-managed DFD, ETP, TR, and Minuta recipes MUST guide the model to consider all available SD item evidence without treating semantic-summary fields as mandatory wording instructions. Recipes MUST keep guidance document-facing and MUST NOT instruct final drafts to verbalize internal grouping, consolidation, or suppression heuristics.

#### Scenario: Recipes do not require objectSemanticSummary wording
- **WHEN** repository-managed recipes are loaded for DFD, ETP, TR, or Minuta generation
- **THEN** they do not require the model to draft from `objectSemanticSummary.summaryLabel`, `objectSemanticSummary.primaryGroups`, `objectSemanticSummary.componentFamilies`, or `objectSemanticSummary.shouldAvoid*` fields
- **AND** they instead instruct the model to use the stored object, justification, and available item evidence as source context

#### Scenario: Recipes preserve a concise anti-first-item rule
- **WHEN** a recipe describes how to handle SD item evidence
- **THEN** it tells the model to consider all available top-level items and avoid treating the first item as the entire object
- **AND** it does not add dense instructions about semantic consolidation, material-group inference, dominant items, or heuristic leakage

### Requirement: Document recipes MUST avoid artificial multi-item categories
Repository-managed recipes MUST prohibit replacing concrete SD item terms with broad generic categories unless those categories are directly present or clearly supported by source evidence. This prohibition MUST be expressed as drafting guidance, not as an internal semantic-summary contract.

#### Scenario: Concrete source terms remain preferred
- **WHEN** available SD evidence contains concrete item labels such as kits, recipientes, embalagens, fitas, materiais escolares, or accessories
- **THEN** recipes guide the model to preserve concrete source terminology where relevant
- **AND** recipes do not force generic umbrella labels such as "materiais de apoio", "insumos operacionais", "componentes logísticos", or "materiais diversos"

#### Scenario: Recipe language stays natural and document-facing
- **WHEN** generated document instructions are reviewed
- **THEN** they are framed as ordinary drafting guidance for procurement documents
- **AND** they do not expose terms like "objectSemanticSummary", "primaryGroups", "summaryLabel", "item dominante", "consolidação semântica", "camada heurística", or "racional da consolidação" as text to be echoed in final documents
