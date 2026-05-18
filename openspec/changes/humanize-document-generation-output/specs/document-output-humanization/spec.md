## ADDED Requirements

### Requirement: Final document output MUST hide pipeline intelligence
The system MUST preserve semantic safety internally while preventing final generated documents from verbalizing pipeline mechanics, missing-context explanations, or AI self-protective reasoning. Final drafts MUST read as natural institutional documents rather than as model outputs explaining their constraints.

#### Scenario: Final draft avoids pipeline metalinguistic prose
- **WHEN** a generated document is finalized from an enriched SD context with missing optional data
- **THEN** the final draft does not mention pipeline, context package, inference, source confidence, missing context, or internal safety rules
- **AND** missing data is handled through placeholders, concise institutional wording, or omission according to document type

#### Scenario: Safety remains internal
- **WHEN** an SD has zero-value price evidence or absent budget data
- **THEN** the pipeline still prevents invented values and unsupported budget claims
- **AND** the final draft does not repeatedly explain that the system is avoiding invented data

### Requirement: Humanization Pass MUST refine text surface without changing facts
The system MUST provide a Humanization Pass after Writer and before Reviewer. The pass MUST reduce meta-language, visible caution, repetitive safety phrases, excessive symmetry, and over-explained prose while preserving facts, placeholders, document role, values, item coverage, and required structure.

#### Scenario: Humanization removes visible caution without inventing
- **WHEN** a writer draft contains repeated phrases such as "na ausência de", "o contexto não apresenta", or "quando houver" around missing data
- **THEN** the Humanization Pass rewrites the passage into natural institutional prose, a placeholder, or concise omission
- **AND** it does not add a price, date, supplier, legal path, budget allocation, or operational detail absent from the context

#### Scenario: Humanization preserves document role
- **WHEN** the requested document type is `tr`
- **THEN** the Humanization Pass keeps the draft operational and does not add ETP market-analysis sections or Minuta party clauses

### Requirement: Writer styles MUST control final prose shape
The system MUST support writer styles `dry_legal`, `administrative`, `technical`, `operational`, and `institutional`. The selected writer style MUST influence sentence density, section depth, clause dryness, and level of explanation without changing the enriched facts.

#### Scenario: Minuta uses dry legal style
- **WHEN** the requested document type is `minuta`
- **THEN** the selected writer style is `dry_legal`
- **AND** the generated draft prefers concise contractual clauses, placeholders, and direct obligations over explanatory analysis

#### Scenario: TR uses operational style
- **WHEN** the requested document type is `tr`
- **THEN** the selected writer style is `operational`
- **AND** the generated draft emphasizes execution, receiving, obligations, fiscalization, payment, and acceptance in practical language

#### Scenario: ETP style varies by classification
- **WHEN** the requested document type is `etp`
- **AND** the enriched classification indicates a technical or continuous service
- **THEN** the selected writer style emphasizes technical analysis and operational robustness
- **WHEN** the enriched classification indicates a social or institutional action
- **THEN** the selected writer style emphasizes administrative and institutional reasoning

### Requirement: Section depth MUST vary naturally by role and style
The system MUST avoid mechanically equal section length across generated documents. Section depth MUST vary according to document type, writer style, classification, and document plan so ordinary sections can be concise while materially important sections receive more detail.

#### Scenario: Simple sections remain concise
- **WHEN** a generated Minuta has no specific budget allocation or signature date
- **THEN** the budget and signature-related sections use placeholders and concise wording
- **AND** they do not contain long explanations of why the data is absent

#### Scenario: Material sections can remain robust
- **WHEN** a TR for recurring RH advisory services is generated
- **THEN** execution, obligations, fiscalization, and payment controls receive more detail than boilerplate closing clauses

### Requirement: Reviewer MUST detect meta-language and excessive defensiveness
The system MUST classify visible AI language and over-defensive drafting as review issues. The review issue taxonomy MUST include `meta_language` and `excessive_defensiveness`, and the reviewer MUST provide targeted instructions to simplify, omit, use placeholders, or convert explanation into natural institutional wording.

#### Scenario: Reviewer flags metalinguistic absence handling
- **WHEN** a draft repeatedly uses phrases such as "na ausência de contexto", "o contexto não apresenta", "quando informado", "quando suportado", or "não foi identificado"
- **THEN** the reviewer returns an issue of type `meta_language`
- **AND** the issue instructs the rewriter to remove the metalinguistic phrasing

#### Scenario: Reviewer flags excessive defensiveness
- **WHEN** a draft overuses conditional caution such as "desde que", "poderá", "deverá ser confirmado", or repeated explanations of missing data
- **THEN** the reviewer returns an issue of type `excessive_defensiveness`
- **AND** the issue instructs the rewriter to make the passage drier, shorter, and more institutional
