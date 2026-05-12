## ADDED Requirements

### Requirement: Semantic summary MUST represent the contracting object as structured data
The system MUST produce an `objectSemanticSummary` from available SD/process evidence before document drafting. The summary MUST be structured data and MUST include at least object type, source item labels, primary material groups, a compact summary label, complementary/accessory indicators, item-level-detail guidance flags, quantitative-detail guidance flags, and dominant purpose when supported by context.

#### Scenario: Multi-item supply produces concrete groups
- **WHEN** the SD evidence contains items such as "pote plástico 1L", "kit com 2 recipientes", "kit com 3 recipientes", "embalagens", and "fita adesiva"
- **THEN** the summary object type indicates a multi-item supply
- **AND** the primary groups preserve concrete labels such as recipientes plásticos, kits compostos, embalagens, and materiais auxiliares de acondicionamento
- **AND** the summary marks complementary items as present
- **AND** the summary marks item-level and quantitative detail as unsuitable for high-level object drafting

#### Scenario: Unitary object remains unitary
- **WHEN** the SD/process evidence describes one materially unitary object without multiple item groups or complementary materials
- **THEN** the summary object type indicates a unitary object
- **AND** the summary preserves the specific object label from the source
- **AND** the summary does not invent primary groups only to force aggregation

### Requirement: Semantic summary MUST preserve lexical and material fidelity
The system MUST derive primary groups and reusable labels from real item names, extracted item descriptions, structured item arrays, process object text, and supported contextual purpose. It MUST preserve concrete material meaning and MUST NOT replace source-grounded items with broad generic categories unless those categories are explicitly present in the source evidence.

#### Scenario: Purpose does not create artificial material groups
- **WHEN** the process context mentions distribution, event, commemorative action, or institutional purpose but the SD items are concrete supplies
- **THEN** the summary may capture the purpose as `dominantPurpose`
- **AND** it does not create unsupported primary groups such as "materiais de apoio", "insumos operacionais", "componentes logísticos", "estrutura consolidada", "grupos correlatos", or "itens dominantes"

#### Scenario: Generic labels require source support
- **WHEN** a broad label such as "materiais diversos" is not present in item labels, object text, or equivalent source evidence
- **THEN** the summary does not use that broad label as a primary group or summary label
- **AND** it keeps the concrete source item groups visible instead

### Requirement: Semantic summary MUST identify complementary items and accessories
The system MUST distinguish primary material groups from complementary items and accessories when the SD evidence supports the distinction. Complementary or accessory signals MUST refine the structured summary without collapsing the whole object into the complementary item.

#### Scenario: Packaging and adhesive supplies are complementary
- **WHEN** the SD evidence contains recipients or kits plus embalagens, fitas, adesivos, or similar acondicionamento materials
- **THEN** the summary identifies the recipients or kits as primary groups
- **AND** it identifies the packaging or adhesive materials as complementary or auxiliary acondicionamento items
- **AND** it does not make the complementary item the dominant object label

#### Scenario: Accessories remain concrete
- **WHEN** the SD evidence contains equipment plus cabos, adaptadores, periféricos, or similar accessory items
- **THEN** the summary includes accessories as a concrete group or accessory signal
- **AND** it does not replace the set with unsupported generic labels such as "componentes logísticos"

### Requirement: Semantic summary MUST NOT generate final document prose
The semantic layer MUST NOT write DFD, ETP, TR, Minuta, legal, contractual, or institutional narrative text. Its output MUST remain a compact reusable representation of the object and MUST NOT explain internal heuristics to be copied into final documents.

#### Scenario: Summary output is not a document paragraph
- **WHEN** the semantic layer receives SD/process evidence
- **THEN** it returns structured fields rather than final Markdown sections, legal clauses, ETP analysis, TR execution text, DFD justification, or Minuta contractual wording
- **AND** it does not output explanatory phrases about dominant items, grouping mechanics, or consolidation rationale for document prose consumption

