## ADDED Requirements

### Requirement: Document recipes MUST consume enriched context and document plans
The system MUST provide repository-managed recipes for DFD, ETP, TR, and Minuta that are used by the writer stage together with the enriched context package and document-specific plan. Recipes MUST NOT be responsible for extracting SD facts, classifying procurement type, generating broad administrative inferences, or planning all document families at once.

#### Scenario: Writer loads role-specific recipe inputs
- **WHEN** the backend prepares a writer request for `dfd`, `etp`, `tr`, or `minuta`
- **THEN** it resolves the matching repository-managed instruction asset and Markdown template
- **AND** it supplies the enriched context package and requested type's document plan as separate inputs to the writer

#### Scenario: Recipe does not own semantic enrichment
- **WHEN** a document instruction asset is reviewed or loaded for generation
- **THEN** it focuses on document role, limits, structure, tone, anti-hallucination, zero-value handling, signatures, and placeholders
- **AND** it does not duplicate the full semantic classification rubric or broad inference engine

### Requirement: DFD recipe MUST stay concise and demand-formalization focused
The DFD recipe MUST guide the writer to produce a short initial demand-formalization document that uses the enriched context proportionally. It MUST avoid market study, detailed alternatives, risk matrix, execution clauses, and contract language except where minimal context is needed to formalize the demand.

#### Scenario: DFD instruction boundaries are explicit
- **WHEN** the DFD instruction asset is used by the writer
- **THEN** it instructs the writer to keep the document formal, concise, administrative, and limited to demand formalization
- **AND** it instructs the writer not to turn the DFD into an ETP, TR, or Minuta

### Requirement: ETP recipe MUST stay analytical and proportional
The ETP recipe MUST guide the writer to produce an analytical study that is proportional to the enriched classification. It MUST address need, alternatives, risk, estimate handling, sustainability when compatible, and management or fiscalization focus without becoming an operational TR or contractual Minuta.

#### Scenario: ETP instruction boundaries are explicit
- **WHEN** the ETP instruction asset is used by the writer
- **THEN** it instructs the writer to use the document plan's recommended depth and focus areas
- **AND** it prevents the draft from replacing feasibility analysis with TR execution clauses or Minuta legal clauses

### Requirement: TR recipe MUST stay operational and executable
The TR recipe MUST guide the writer to produce operational requirements for the contracted object, including specifications, execution, receiving, obligations, fiscalization, payment, and acceptance criteria. It MUST avoid ETP-style viability analysis and Minuta-style contractual party clauses.

#### Scenario: TR instruction boundaries are explicit
- **WHEN** the TR instruction asset is used by the writer
- **THEN** it instructs the writer to convert enriched context and plan focus areas into executable operational requirements
- **AND** it prevents the draft from becoming an ETP study or a contract draft

### Requirement: Minuta recipe MUST stay contractual and placeholder-safe
The Minuta recipe MUST guide the writer to produce a contract draft with contractual clauses, fixed legal language when applicable, and placeholders for missing data. It MUST avoid legal opinions, feasibility studies, market analysis, TR technical headings, and invented party, price, budget, or process data.

#### Scenario: Minuta instruction boundaries are explicit
- **WHEN** the Minuta instruction asset is used by the writer
- **THEN** it instructs the writer to use legal contract language, placeholders, signatures, parties, price handling, and fixed clauses where applicable
- **AND** it prevents the draft from becoming DFD, ETP, or TR content

### Requirement: Shared generation rules MUST not be duplicated across document instructions
General anti-hallucination, zero-value, context-traceability, and semantic enrichment rules MUST live in shared pipeline instructions, schemas, or enrichment assets. Document instruction assets MAY restate a short role-specific reminder, but MUST NOT carry separate inconsistent copies of the same heavy classification and inference logic.

#### Scenario: Shared rules have one source
- **WHEN** a shared rule such as zero-value absence or classification-before-inference changes
- **THEN** the implementation updates the shared pipeline or enrichment source
- **AND** individual recipe assets do not require separate independent rewrites of the full rule
