## ADDED Requirements

### Requirement: Document generation pipeline MUST run specialized stages in order
The system MUST generate procurement documents through an internal pipeline that runs extraction, context enrichment, document planning, document writing, structured review, and final rewrite in that order. Later stages MUST receive the validated output of earlier stages instead of rebuilding their own independent interpretation of the SD or process context.

#### Scenario: Pipeline executes ordered stages
- **WHEN** an authorized actor requests generation of an ETP for a stored process
- **THEN** the system extracts factual context before semantic enrichment
- **AND** semantic enrichment completes before document planning
- **AND** planning completes before Markdown writing
- **AND** structured review runs before the final draft is persisted as completed

### Requirement: Extractor stage MUST emit factual SD evidence without inference
The extractor stage MUST emit only literal or normalized facts from the stored process, source metadata, organization, department, responsible data, structured items, and budget fields. It MUST NOT classify the procurement object, infer administrative purpose, create risks, create alternatives, or fill missing values by assumption.

#### Scenario: Extractor preserves facts and avoids inference
- **WHEN** a process source contains an SD object, justification, item rows, quantities, units, administrative fields, and budget fields
- **THEN** the extractor output includes those facts when available
- **AND** it does not emit procurement type, operational nature, risks, alternatives, or legal-path conclusions

#### Scenario: Extractor treats zero values as missing estimate evidence
- **WHEN** an SD or process item value is `0`, `0,00`, `0.00`, or `R$ 0,00`
- **THEN** the extractor normalizes that value as absent estimate evidence
- **AND** the extracted facts set `hasValidEstimatedValue` to `false` unless another positive valid estimate exists

### Requirement: Context enrichment MUST classify before making inferences
The context enrichment stage MUST create an `EnrichedContextPackage` from extracted facts by first classifying the procurement object, then compressing the object semantically, and only then deriving administrative inferences, pending issues, risks, alternatives, recommended tone, and generation hints. Inferences MUST be labeled by source and confidence and MUST NOT be presented as confirmed facts.

#### Scenario: Enrichment follows classification-first rule
- **WHEN** extracted facts describe a service, action, event, acquisition, or mixed object
- **THEN** the enrichment stage produces a semantic classification before producing inferences, risks, alternatives, or document planning hints
- **AND** each inference identifies whether it came from explicit evidence, semantic inference, or administrative hypothesis

#### Scenario: Enrichment keeps missing data as pending issues
- **WHEN** required details such as valid estimate, target beneficiaries, execution date, delivery location, scope, or budget data are absent
- **THEN** the enrichment stage records compatible pending issues
- **AND** it does not invent the missing data in facts or inferences

### Requirement: Enriched context package MUST be canonical and document-neutral
The system MUST define a canonical enriched context package schema that contains source identification, extracted facts, complete item list, estimated value availability, semantic object compression, procurement classification, administrative inferences, pending issues, risks, alternatives, recommended tone, document planning guidance, and generation hints. The package MUST be usable by DFD, ETP, TR, and Minuta planning without embedding one document type's structure into another.

#### Scenario: Context package contains required sections
- **WHEN** the context enrichment stage completes for a valid generation request
- **THEN** the resulting package includes source, facts, semanticObject, classification, inferences, pendingIssues, risks, alternatives, recommended tone guidance, documentPlan or document planning hints, and generation hints
- **AND** the facts section retains the complete item list separately from semantic compression

### Requirement: Document planning MUST vary by document type
The planning stage MUST transform the enriched context into a document-specific plan for the requested type. DFD plans MUST remain short and suitable for initial demand formalization. ETP plans MUST be analytical and proportional to complexity. TR plans MUST focus on operational execution, receiving, obligations, fiscalization, payment, and specifications. Minuta plans MUST focus on contractual clauses, placeholders, fixed language, and legal drafting without technical viability analysis.

#### Scenario: DFD plan does not become ETP analysis
- **WHEN** the requested document type is `dfd`
- **THEN** the plan focuses on initial demand formalization, object, justification, essential requirements, and signature
- **AND** it avoids detailed market study, alternatives, risk matrix, and execution clauses

#### Scenario: ETP plan is proportional to complexity
- **WHEN** the requested document type is `etp`
- **THEN** the plan includes need analysis, alternatives, risks, estimate handling, sustainability when compatible, and management or fiscalization focus areas
- **AND** the recommended depth reflects the enriched classification's execution complexity

#### Scenario: TR plan stays operational
- **WHEN** the requested document type is `tr`
- **THEN** the plan focuses on object specification, execution, delivery or service evidence, receiving, obligations, fiscalization, payment, and acceptance
- **AND** it avoids contractual-party clauses reserved for Minuta

#### Scenario: Minuta plan stays contractual
- **WHEN** the requested document type is `minuta`
- **THEN** the plan focuses on contract clauses, parties, object, price placeholders, execution, obligations, sanctions, validity, signatures, and fixed clause preservation
- **AND** it avoids ETP viability analysis and TR technical section headings

### Requirement: Reviewer MUST return structured review JSON
The reviewer stage MUST return a validated `DocumentReviewResult` JSON object with status, score, issues, and global revision instructions. The review MUST evaluate document-role adherence, hallucination, context usage, zero-value handling, item omission, repetition, generic wording, proportional depth, document-type confusion, signatures, placeholders, alternatives, risks, and whether the document is human and revisable.

#### Scenario: Reviewer flags a generic misaligned draft
- **WHEN** the writer returns a draft that is generic, repetitive, uses a valid price for a zero-value SD, or confuses ETP with TR content
- **THEN** the reviewer returns `needs_revision`
- **AND** it includes typed issues with severity, problem, and targeted revision instruction

### Requirement: Final rewrite MUST be targeted and bounded
When review status is `needs_revision`, the final rewrite stage MUST revise the current draft using the original draft, enriched context, document plan, review result, and document-specific instructions. It MUST apply targeted adjustments instead of restarting from scratch without need, and the pipeline MUST run no more than two automatic revision cycles for a generation request.

#### Scenario: Rewriter applies review feedback without infinite loop
- **WHEN** a generated document receives review status `needs_revision`
- **THEN** the pipeline invokes the rewriter with the current draft and structured review instructions
- **AND** it stops after approval or after two rewrite cycles, whichever happens first

### Requirement: Pipeline debug trace MUST be opt-in
The system MUST produce a pipeline debug trace containing extracted facts, enriched context, classification, document plan, first draft, review results, rewrite attempts, and final draft for troubleshooting. The system MUST NOT expose this trace in default user-facing responses.

#### Scenario: Default response hides debug trace
- **WHEN** an authorized actor generates a document without requesting debug output
- **THEN** the response and ordinary document reads do not include extracted facts, internal plans, review objects, or draft attempts

#### Scenario: Debug response includes pipeline stages
- **WHEN** an authorized actor requests generation with debug output enabled
- **THEN** the response may include the pipeline trace scoped to that generation request
- **AND** the trace includes the stage outputs needed to inspect extraction, enrichment, planning, review, rewrite, and finalization
