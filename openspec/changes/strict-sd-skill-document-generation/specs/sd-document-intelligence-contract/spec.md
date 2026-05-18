## ADDED Requirements

### Requirement: Runtime SD intelligence contract MUST mirror the Codex skill
The system MUST provide a runtime-loadable SD document intelligence contract derived from `.codex/skills/sd-document-intelligence/SKILL.md`. The contract MUST include the skill workflow, stage responsibilities, classification taxonomy, context package expectations, anti-alucination rules, zero-value rule, document planning rules, and document role boundaries.

#### Scenario: Backend loads packaged skill contract
- **WHEN** SD-backed document generation starts
- **THEN** the backend loads the runtime SD intelligence contract before building extraction, enrichment, planning, writer, reviewer, or rewrite prompts

#### Scenario: Contract exposes source identity
- **WHEN** the runtime contract is loaded
- **THEN** it exposes the contract version, source skill path, source digest, and synchronized contract digest for debug and validation

#### Scenario: Skill source and runtime contract diverge
- **WHEN** the Codex skill source changes without synchronizing the runtime contract
- **THEN** automated validation fails and reports that the runtime document intelligence contract is stale

### Requirement: SD intelligence contract MUST enforce stage ordering
The system MUST enforce the skill's stage order for SD-backed documents: factual extraction, semantic classification, context enrichment, document planning, writing, review, and final rewrite. The system MUST NOT perform administrative inference before semantic classification.

#### Scenario: Classification precedes inference
- **WHEN** the system enriches an SD whose facts have been extracted
- **THEN** it classifies procurement type, operational nature, execution complexity, public interest profile, probable legal path, confidence, and reasoning before creating inferences, risks, alternatives, or document plans

#### Scenario: Writer receives planned context
- **WHEN** the Writer Agent generates DFD, ETP, TR, or Minuta Markdown
- **THEN** it receives the enriched context package, the selected document plan, the document recipe, and the runtime skill contract rules

#### Scenario: Reviewer evaluates skill-aligned output
- **WHEN** a draft has been written and humanized
- **THEN** the Reviewer Agent evaluates it against the skill contract, the enriched context package, the document plan, and the requested document type

### Requirement: Context package MUST preserve facts, inferences, and pendencies separately
The system MUST create a canonical enriched context package that keeps extracted facts, semantic inferences, pending issues, risks, alternatives, recommended tone, document plans, and generation hints in separate fields. The system MUST NOT promote an inference or administrative hypothesis to confirmed fact.

#### Scenario: SD omits distribution criteria
- **WHEN** an SD describes free distribution but does not state the target public or distribution criteria
- **THEN** the enriched context records target public and distribution criteria as pending issues instead of inventing beneficiaries

#### Scenario: Inference is used for planning
- **WHEN** the context classifies a procurement as social or institutional
- **THEN** the document plan may calibrate tone, controls, risks, and fiscalization to that classification without stating unsupported facts in the final document

### Requirement: Zero values MUST be treated as absent estimates or prices
The system MUST treat values `0`, `0,00`, `0.00`, and `R$ 0,00` as absence of a valid estimate or price in every skill-aligned stage.

#### Scenario: SD item has zero total
- **WHEN** an SD item has total value `0,00`
- **THEN** the extracted facts preserve the raw value and the enriched context marks the valid estimate as absent

#### Scenario: Minuta price uses placeholder
- **WHEN** a Minuta is generated from an SD with only zero values
- **THEN** the contract price clause uses a price placeholder rather than treating zero as the contract price

### Requirement: Document planning MUST distinguish DFD, ETP, TR, and Minuta roles
The system MUST generate document plans that preserve the role boundaries defined by the skill: DFD as initial formalization, ETP as proportional analysis, TR as operational execution, and Minuta as contractual formalization.

#### Scenario: DFD plan remains concise
- **WHEN** the requested document type is DFD
- **THEN** the document plan avoids market study, alternatives analysis, detailed risks, contractual clauses, and operational execution detail

#### Scenario: ETP plan remains analytical
- **WHEN** the requested document type is ETP
- **THEN** the document plan includes proportional alternatives, risks, estimate handling, sustainability when compatible, and management/fiscalization guidance

#### Scenario: TR plan remains operational
- **WHEN** the requested document type is TR
- **THEN** the document plan focuses on specifications, execution, receiving, obligations, fiscalization, payment, and acceptance

#### Scenario: Minuta plan remains contractual
- **WHEN** the requested document type is Minuta
- **THEN** the document plan focuses on clauses, placeholders, legal-contractual language, signature slots, and fixed clauses without becoming a technical study
