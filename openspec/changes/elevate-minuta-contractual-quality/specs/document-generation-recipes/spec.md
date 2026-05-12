## ADDED Requirements

### Requirement: Minuta recipe MUST preserve modular contract architecture
The `minuta` generation recipe MUST preserve the current architecture of fixed clauses, semi-fixed clauses, conditional blocks, and contextual contractual passages. Fixed clauses MUST remain stable and protected, while semi-fixed clauses and conditional modules MAY adapt to the object only within the recipe's anti-hallucination constraints.

#### Scenario: Minuta prompt preserves architecture
- **WHEN** the backend prepares a `minuta` generation request
- **THEN** the prompt identifies the Minuta as a standardized administrative contract draft
- **AND** it preserves the canonical clause structure
- **AND** it instructs the model to keep fixed clauses stable
- **AND** it allows contextualization only in semi-fixed clauses, conditional blocks, and contextual passages

#### Scenario: Fixed clauses remain stable
- **WHEN** the Minuta template or generated Minuta contains fixed clauses for prerogatives, alteration and readjustment, habilitation, publicity, omitted cases, or forum
- **THEN** the recipe and prompt rules preserve those clauses as stable contract text
- **AND** they prohibit creative rewriting, restructuring, summarizing, or removal of fixed clauses
- **AND** placeholder substitution remains the only routine model-level change allowed inside fixed clauses

### Requirement: Minuta recipe MUST formalize TR operation as contractual language
The `minuta` recipe MUST instruct the model to transform operational context from TR, process data, and structured inputs into contractual clauses. The Minuta MUST formalize execution, responsibilities, payment support, fiscalization, receipt, correction, and legal-contractual consequences without becoming TR, ETP, legal opinion, or a generic checklist.

#### Scenario: Minuta role is explicit
- **WHEN** a Minuta prompt is assembled
- **THEN** it states that DFD formalizes the need, ETP analyzes feasibility, TR operationalizes execution, and Minuta formalizes the operation as a contractual bond
- **AND** it instructs the model to convert operational context into contractual wording
- **AND** it prohibits copying TR, ETP, DFD, or legal opinion structure

#### Scenario: Minuta does not become TR or ETP
- **WHEN** a Minuta is generated for any process category
- **THEN** the prompt prohibits DFD, ETP, and TR headings
- **AND** it prohibits ETP-style market study, alternative analysis, viability discussion, and legal opinion
- **AND** it prohibits autonomous TR-style technical sections that explain execution outside the contract clause structure

### Requirement: Minuta semi-fixed clauses MUST be contextual and contractually mature
The `minuta` template and instructions MUST make semi-fixed clauses more contextual, operationally coherent, and contractually mature while preserving a standardized and reusable contract form. The variable clauses MUST use contractual language such as obligations, conditions, execution, ateste, receipt, conformity, correction, fiscalization, and administrative process handling.

#### Scenario: Execution clause reflects object dynamics
- **WHEN** the Minuta template guides the execution clause
- **THEN** it instructs the model to describe the execution dynamic according to the nature of the object
- **AND** it connects execution to the TR or technical instrument when available
- **AND** it uses moderate contractual wording instead of generic placeholders such as only "execução conforme definição da Administração"
- **AND** it does not invent date, place, duration, quantitative detail, team, equipment, technical rider, schedule, SLA, or execution condition

#### Scenario: Obligation clauses are executable and fiscalizable
- **WHEN** the Minuta template guides contractor and contracting authority obligations
- **THEN** it instructs the model to write obligations that are contractual, executable, fiscalizable, proportional, and compatible with the object
- **AND** it discourages generic checklist bullets and repetitive obligations
- **AND** it prohibits unsupported obligations, invented documents, invented staff, invented certifications, and incompatible type-specific items

#### Scenario: Fiscalization clause improves contract management
- **WHEN** the Minuta template guides fiscalization
- **THEN** it instructs the model to cover monitoring, communication, records, conformity checks, validation, corrective requests, and evidence for ateste when compatible with the object
- **AND** it does not invent named fiscal agents, inspection dates, reporting systems, periodicities, forms, or measurement criteria

#### Scenario: Receipt and acceptance clause handles conformity
- **WHEN** the Minuta template guides receipt and acceptance
- **THEN** it instructs the model to describe contractual receipt logic, conformity verification, acceptance, refusal, correction, replacement, or refazimento when compatible with the object
- **AND** it does not invent deadlines, provisional or definitive receipt rites, measurement regimes, or special acceptance documents not supported by context

#### Scenario: Penalties clause remains conservative but contractual
- **WHEN** the Minuta template guides penalties
- **THEN** it instructs the model to use mature contractual wording for consequences of nonperformance, delay, inadequate execution, and nonconformity
- **AND** it prohibits invented fine percentages, fine amounts, penalty types, deadlines, sanction procedures, and unsupported hypotheses

### Requirement: Minuta recipe MUST provide conditional modules by contracting type
The `minuta` recipe MUST provide reusable conditional contractual modules by predominant object type. The modules MUST enrich execution, obligations, fiscalization, receipt, and payment support while prohibiting copy-paste of incompatible examples.

#### Scenario: Events and artistic presentations receive event contract modules
- **WHEN** the object indicates artistic presentation, cultural event, festivities, or event operation
- **THEN** the prompt includes contractual guidance for official programming, operational alignment, mounting or setup when supported, sound or technical alignment, logistics, access, institutional support, schedule alignment, and event operation
- **AND** it prohibits invented rider, duration, stage, equipment, backstage/camarim, quantities, exact schedule, specific infrastructure, or artist credentials

#### Scenario: Software and IT receive technology contract modules
- **WHEN** the object indicates software, system, support, IT, technology service, implementation, or integration
- **THEN** the prompt includes contractual guidance for implementation, support, availability expectations, updates, maintenance, integration, LGPD relevance, confidentiality, operational continuity, training, and information security when compatible with context
- **AND** it prohibits invented SLA, architecture, tools, data-processing details, service levels, credentials, deadlines, or unsupported technical obligations

#### Scenario: Consulting and advisory receive deliverable contract modules
- **WHEN** the object indicates consulting, advisory, technical support, administrative support, human resources advisory, or specialized guidance
- **THEN** the prompt includes contractual guidance for deliverables, reports, meetings, technical support, monitoring, institutional validation, executive schedule alignment, opinions or pareceres when supported, and interaction with the requesting unit
- **AND** it prohibits invented reports, meeting cadence, deadlines, credentials, methodology, or deliverable formats not supported by context

#### Scenario: Supply of goods receives delivery and conformity modules
- **WHEN** the object indicates supply of goods, material acquisition, product delivery, or equipment acquisition
- **THEN** the prompt includes contractual guidance for delivery, receipt, substitution, conformity, warranty or support when supported, transportation, packaging/acondicionamento, and inspection
- **AND** it prohibits invented quantities, brands, technical standards, warranty periods, delivery deadlines, locations, or inspection rites

#### Scenario: Works and engineering receive execution-control modules
- **WHEN** the object indicates works, engineering service, reform, construction, maintenance, or technical engineering intervention
- **THEN** the prompt includes contractual guidance for schedule alignment, measurement when supported, technical responsibility when supported, safety, technical conformity, records, provisional or definitive receipt only when supported, and correction of nonconformities
- **AND** it prohibits invented projects, responsible professionals, ART/RRT, measurements, diaries, safety plans, receipt deadlines, materials, or technical details

#### Scenario: Continuing and general services receive service continuity modules
- **WHEN** the object indicates continuing services, general services, recurring operational support, or service routines
- **THEN** the prompt includes contractual guidance for continuity, monitoring, performance, communication, team substitution when supported, reports when supported, periodic fiscalization, and correction of failures
- **AND** it prohibits invented staff size, shifts, recurring reports, periodicity, performance indicators, material lists, or unsupported service routines

### Requirement: Minuta recipe MUST preserve anti-hallucination and placeholder safety
The `minuta` recipe MUST continue to prohibit invented legal, commercial, operational, technical, fiscal, supplier, payment, sanction, and execution facts. When data is absent, the recipe MUST prefer placeholders and natural contractual conditional wording over repeated dry absence statements.

#### Scenario: Missing contract data remains safe
- **WHEN** context lacks contract number, procedure number, contractor data, price, budget allocation, dates, place, term, payment details, or signature data
- **THEN** the prompt instructs the model to preserve placeholders or use conservative contractual wording
- **AND** it avoids excessive repetition of "não informado", "quando aplicável", and "a definir"
- **AND** it does not invent the missing facts

#### Scenario: Unsupported facts are prohibited
- **WHEN** Minuta context lacks specific support for a fact
- **THEN** the prompt prohibits invented values, fines, percentages, SLA, schedules, quantities, technical rider, guarantees, legal clauses, legal grounds, obligations, documents, regime, supplier credentials, warranty terms, measurements, and execution details

### Requirement: Minuta prompt tests MUST protect quality, modularity, and fact safety
The document generation recipe tests MUST cover Minuta modular architecture, fixed clause stability, richer semi-fixed clauses, conditional modules by contracting type, conservative placeholders, and rejection of unsupported factual claims.

#### Scenario: Minuta prompt tests cover representative contract types
- **WHEN** tests build Minuta prompts for artistic/event, software/IT, consulting/advisory, goods supply, works/engineering, and continuing/general service contexts
- **THEN** each prompt includes the Minuta contractual role guidance
- **AND** each prompt selects or exposes compatible conditional modules
- **AND** each prompt preserves fixed clause rules
- **AND** each prompt prohibits TR-style headings, generic checklist behavior, and unsupported factual claims
