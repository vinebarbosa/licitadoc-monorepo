## ADDED Requirements

### Requirement: Document generation MUST use one shared object semantic summary
The system MUST compute or retrieve one `objectSemanticSummary` for a process before building DFD, ETP, TR, or Minuta generation prompts. All document prompt builders for the same process context MUST use the same semantic interpretation fields instead of independently reinterpreting SD item evidence.

#### Scenario: All draft types receive the same semantic interpretation
- **WHEN** DFD, ETP, TR, and Minuta prompts are built for the same process containing a multi-item SD
- **THEN** each prompt receives the same object type, primary groups, summary label, complementary/accessory indicators, dominant purpose, and item-level-detail flags from `objectSemanticSummary`
- **AND** no document prompt recomputes a conflicting object interpretation from only its own recipe or narrative rules

#### Scenario: Source changes produce a new summary consistently
- **WHEN** the stored process/source metadata changes before prompt assembly
- **THEN** the next generated document prompt uses a semantic summary derived from the updated source evidence
- **AND** all draft types built from that updated process use the updated semantic interpretation consistently

### Requirement: Document generation prompts MUST not expose semantic heuristics as drafting content
The system MUST pass only document-safe semantic-summary fields into final document prompts. Prompt context for DFD, ETP, TR, and Minuta MUST NOT include internal heuristic fields or phrases that invite generated documents to explain consolidation mechanics.

#### Scenario: Prompt context omits dominant-item and rationale wording
- **WHEN** a prompt is assembled for any supported document type
- **THEN** the prompt does not expose fields labeled as dominant item, consolidation rationale, grouping rationale, heuristic, or item dominance
- **AND** it exposes reusable semantic fields such as object type, primary groups, summary label, dominant purpose, and detail guidance flags

#### Scenario: Multi-item context stays concrete in prompts
- **WHEN** the semantic summary indicates a multi-item supply with concrete primary groups
- **THEN** the prompt context includes those primary groups and the compact summary label
- **AND** it does not introduce unsupported generic categories from document-specific prompt logic

### Requirement: Document generation MUST preserve unitary object behavior
The semantic-summary integration MUST keep unitary object generation stable. When the semantic summary indicates a unitary object, prompt builders MUST preserve the specific source object and MUST NOT apply multi-item grouping or broad category labels.

#### Scenario: Unitary object prompt remains specific
- **WHEN** a prompt is built for a process whose semantic summary indicates a unitary object
- **THEN** the prompt preserves the source object label as the main object reference
- **AND** it does not include multi-item grouping instructions, complementary-item treatment, or artificial summary groups

