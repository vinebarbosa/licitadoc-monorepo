## MODIFIED Requirements

### Requirement: DFD generation recipe MUST be repository-managed and runtime-resolvable
The system MUST provide a repository-managed recipe for `dfd` generation that the backend can resolve at runtime without requiring callers to submit a raw provider prompt. The recipe MUST include a textual instruction asset and a Markdown template asset. The restored DFD recipe MUST match the post-`elevate-minuta-contractual-quality` checkpoint and MUST NOT depend on post-checkpoint semantic-summary, multi-item consolidation, item-evidence, or DFD-specific multi-item wording rules.

#### Scenario: Backend resolves the DFD recipe
- **WHEN** the backend prepares a `dfd` generation request for a stored process
- **THEN** it resolves a repository-managed instruction asset and a repository-managed Markdown template for `dfd` before invoking the generation provider

#### Scenario: DFD recipe excludes post-checkpoint multi-item semantic rules
- **WHEN** the canonical `dfd` instruction and template assets are reviewed after the rollback
- **THEN** they do not require `objectSemanticSummary`, semantic primary groups, structured item evidence, dominant-item rationale, multi-item object consolidation, item-level quantity suppression rules, or post-checkpoint anti-heuristic wording rules

### Requirement: DFD Markdown template MUST represent only the canonical DFD structure
The system MUST provide a canonical Markdown model for `dfd` that is derived only from the `DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)` portion of the approved reference document. The template MUST include the DFD sections for solicitation data, demand context, contracting object, justification, essential requirements, and signature block. The template MUST NOT include `ETP` or `TR` sections. The restored template MUST also exclude post-checkpoint multi-item semantic-summary and structured item-evidence placeholders.

#### Scenario: DFD template excludes non-DFD sections
- **WHEN** the canonical `dfd` template is reviewed or loaded for prompt assembly
- **THEN** it contains only DFD headings and placeholders, and does not include headings or structural blocks for `ETP` or `TR`

#### Scenario: DFD template excludes post-checkpoint semantic placeholders
- **WHEN** the canonical `dfd` template is reviewed after the rollback
- **THEN** it does not contain placeholders or instructions for semantic primary groups, structured SD item arrays, consolidated object rationale, or post-checkpoint multi-item item-evidence fields

## ADDED Requirements

### Requirement: Minuta recipe MUST preserve the checkpoint contractual-quality architecture
The system MUST preserve the `minuta` recipe behavior introduced by `elevate-minuta-contractual-quality`. The recipe MUST use stable fixed clauses, richer semi-fixed clauses, conditional contractual modules by predominant object type, conservative missing-data language, and anti-hallucination safeguards while avoiding DFD, ETP, or TR structure in the generated contract.

#### Scenario: Minuta recipe keeps fixed and semi-fixed architecture
- **WHEN** the `minuta` instruction and template assets are reviewed after the rollback
- **THEN** they preserve fixed clause stability, semi-fixed contextual clauses, conditional contractual modules, and conservative placeholder guidance from the checkpoint

#### Scenario: Minuta recipe excludes later semantic-summary dependencies
- **WHEN** the `minuta` instruction and template assets are reviewed after the rollback
- **THEN** they do not require `objectSemanticSummary`, semantic primary groups, structured item evidence, or post-checkpoint multi-item consolidation rules to produce a contract draft
