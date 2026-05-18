## ADDED Requirements

### Requirement: Document recipes MUST remain subordinate to the SD intelligence contract
The system MUST treat DFD, ETP, TR, and Minuta recipes as writer assets only. Recipes and templates MUST NOT replace, duplicate, weaken, or bypass the runtime `sd-document-intelligence` contract for SD classification, enrichment, inference, risk selection, alternatives, document planning, anti-alucination rules, or zero-value handling.

#### Scenario: Recipe is loaded after skill planning
- **WHEN** the pipeline prepares a document writer prompt for an SD-backed process
- **THEN** the selected recipe contributes document role, structure, tone, and template guidance after the skill-aligned context package and document plan have been produced

#### Scenario: Template does not contain intelligence rules
- **WHEN** a DFD, ETP, TR, or Minuta template is reviewed
- **THEN** it contains render structure, headings, placeholders, and fixed clauses only, without classification logic, inference rules, anti-alucination prose, or visible safety behavior

### Requirement: Recipe prompt assembly MUST include the strict skill contract
The system MUST assemble SD-backed writer prompts from the runtime SD intelligence contract, the enriched context package, the document plan, the shared writer rules, the document-specific recipe, the document template, and optional operator instructions.

#### Scenario: ETP prompt uses skill context before recipe guidance
- **WHEN** the system builds an ETP writer prompt for an SD-backed process
- **THEN** the prompt includes the skill-aligned classification, inferences, pending issues, risks, alternatives, recommended tone, and ETP document plan before the recipe is used for writing boundaries and structure

#### Scenario: Minuta prompt preserves contractual placeholders
- **WHEN** the system builds a Minuta writer prompt from an SD with absent contractor, budget, dates, or valid price
- **THEN** the prompt preserves contractual placeholders and uses the skill contract's zero-value and anti-alucination rules instead of asking the writer to infer missing data

### Requirement: Recipe tests MUST guard against skill drift and responsibility leakage
The system MUST include tests proving that document recipes do not regain responsibility for the SD intelligence owned by the skill contract, and that the runtime contract remains synchronized with the Codex skill source.

#### Scenario: Recipe starts duplicating skill intelligence
- **WHEN** a document instruction or template introduces classification, inference, context package, or zero-value logic that belongs to the skill contract
- **THEN** recipe tests fail and identify responsibility leakage

#### Scenario: Skill contract hash changes
- **WHEN** the runtime contract digest differs from the Codex skill source digest without an intentional synchronization update
- **THEN** drift tests fail before implementation is considered valid
