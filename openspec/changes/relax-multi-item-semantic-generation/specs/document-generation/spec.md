## ADDED Requirements

### Requirement: Document generation MUST treat structured SD items as factual evidence
When a stored process contains `sourceMetadata.extractedFields.items`, the system MUST make those items available to document generation as factual source evidence. The system MUST NOT require an intermediate semantic summary to rewrite, replace, or authoritatively consolidate the process object before drafting.

#### Scenario: Structured items are available without semantic authority
- **WHEN** document generation is requested for a process whose source metadata contains multiple structured SD items
- **THEN** the generation context includes a bounded factual item-evidence block containing the available item labels and row evidence
- **AND** the generation context does not require `objectSemanticSummary.primaryGroups`, `objectSemanticSummary.summaryLabel`, or `objectSemanticSummary.shouldAvoid*` fields as authoritative drafting inputs

#### Scenario: Original object context remains available
- **WHEN** structured SD items exist for a process
- **THEN** the generation context still includes the stored process object and available legacy item description as source context
- **AND** the system does not suppress those fields solely because structured item evidence is available

### Requirement: Document generation MUST avoid first-item collapse with simple source evidence
When multiple SD items are available, the system MUST provide enough factual item evidence for DFD, ETP, TR, and Minuta generation to consider the full set of top-level items. The system MUST avoid forcing generated documents through object-group labels that are not directly provided by the stored process or SD item evidence.

#### Scenario: Multi-item evidence remains visible across document types
- **WHEN** DFD, ETP, TR, or Minuta generation is requested for a process with multiple structured SD items
- **THEN** the prompt context exposes all available top-level item labels in a concise factual section
- **AND** the prompt context does not replace those labels with mandatory generic group labels such as "materiais de apoio", "insumos operacionais", "componentes logísticos", or "materiais diversos" unless those terms are present in the source evidence

#### Scenario: Unitary processes continue to use direct object context
- **WHEN** document generation is requested for a process without multiple structured SD items
- **THEN** the system uses the stored process object and available source metadata normally
- **AND** it does not introduce multi-item semantic flags or grouping instructions
