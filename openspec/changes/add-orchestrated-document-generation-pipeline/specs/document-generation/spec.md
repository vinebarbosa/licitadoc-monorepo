## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, structured item and source metadata evidence when available, the requested document type, any optional operator instructions submitted with the request, repository-managed recipes required by that document type, and the internal document-generation pipeline. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, `etp`, `tr`, and `minuta`, the system MUST extract facts, enrich context, plan the requested document type, write Markdown from the matching recipe, run structured review, and persist the final pipeline output. Legacy source metadata MAY be used as fallback evidence, but it MUST NOT override canonical process data or structured items.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, the submitted instructions, and the pipeline's extracted facts, enriched context package, and DFD plan before invoking the writer

#### Scenario: Generation runs pipeline for ETP, TR, and Minuta
- **WHEN** an authorized actor requests an ETP, TR, or Minuta draft for a stored process
- **THEN** the system uses the same extraction, context enrichment, planning, writing, review, and bounded rewrite pipeline for the requested document type
- **AND** the persisted content is the final Markdown output for exactly that requested type

#### Scenario: Generation preserves zero-value absence through final content
- **WHEN** the process or SD source contains only zero-like values such as `0`, `0,00`, `0.00`, or `R$ 0,00`
- **THEN** the pipeline treats the estimate or price as unavailable in facts, enriched context, plan, writer prompt, review, and final draft
- **AND** the final draft does not present the zero-like value as a valid estimate or contract price

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: Document generation MUST keep document roles distinct
The system MUST constrain each generated document to the role of the requested type after writing and review. DFD MUST NOT become ETP, ETP MUST NOT become TR, TR MUST NOT become Minuta, and Minuta MUST NOT become a technical study.

#### Scenario: DFD does not contain ETP or TR sections
- **WHEN** the final generated document type is `dfd`
- **THEN** the persisted draft remains limited to initial demand formalization
- **AND** it does not include market study, detailed alternatives, risk matrix, execution clauses, or contractual clauses as independent sections

#### Scenario: ETP does not become TR
- **WHEN** the final generated document type is `etp`
- **THEN** the persisted draft focuses on need, feasibility, alternatives, risks, estimate handling, and proportional planning
- **AND** it does not replace that analysis with detailed operational clauses, payment rules, or contractor obligations as if it were a TR

#### Scenario: TR does not become Minuta
- **WHEN** the final generated document type is `tr`
- **THEN** the persisted draft focuses on execution, specification, receiving, obligations, fiscalization, and payment conditions
- **AND** it does not introduce contractual party qualification, forum, witness, rescission, or fixed legal clauses as if it were a Minuta

#### Scenario: Minuta does not become technical study
- **WHEN** the final generated document type is `minuta`
- **THEN** the persisted draft follows contract-draft structure with clauses and placeholders
- **AND** it does not include ETP viability analysis, TR technical headings, or DFD demand-formalization sections

### Requirement: Document generation MUST improve proportionality across SD profiles
The system MUST vary document depth, risks, alternatives, and operational detail according to the enriched semantic classification and requested document type. Simple acquisitions MUST remain concise, technical or recurring services MUST receive operationally robust treatment, social or institutional kit distributions MUST address distribution controls, and artistic or cultural presentations MUST address date sensitivity and execution evidence when supported by the SD.

#### Scenario: RH advisory SD generates robust technical ETP
- **WHEN** an ETP is generated for an SD classified as technical or recurring HR advisory service
- **THEN** the document plan and final draft treat the object as technical, recurring, and operationally robust
- **AND** the draft addresses scope, deliverables, periodicity or recurrence, evidence of execution, fiscalization, and dependency controls when compatible with the SD

#### Scenario: Mothers Day kits SD is treated as social or institutional action
- **WHEN** an ETP or TR is generated for an SD involving Mothers Day kits for free distribution
- **THEN** the document plan and final draft treat the object as a one-time social or institutional acquisition/distribution action
- **AND** they address public purpose, target audience or beneficiary criteria as pending issues when absent, quantity justification, delivery control, and free-distribution traceability

#### Scenario: Artistic presentation SD is treated as cultural seasonal execution
- **WHEN** an ETP or TR is generated for an SD involving an artistic or cultural presentation tied to a date or event
- **THEN** the document plan and final draft treat the object as cultural or event-related and seasonal
- **AND** they address date sensitivity, execution proof, cancellation or delay risk, and fiscalization of performance when compatible with the SD

#### Scenario: Simple acquisition remains concise
- **WHEN** a document is generated for a low-complexity acquisition of common goods
- **THEN** the final draft stays proportional to the object
- **AND** it does not add artificial length, complex alternatives, or risks unrelated to the SD
