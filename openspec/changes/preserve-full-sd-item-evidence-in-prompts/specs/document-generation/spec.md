## ADDED Requirements

### Requirement: Document generation MUST assemble prompts from hierarchical item evidence
When a stored process contains reliable structured SD item evidence, document generation MUST include that evidence in prompts as a hierarchy of top-level line items and associated components. Prompt assembly MUST preserve visibility of all top-level items rather than relying only on semantic groups or a representative first-item description.

#### Scenario: DFD prompt includes all top-level item rows
- **WHEN** a DFD prompt is built for an SD-backed process with multiple structured item rows
- **THEN** the prompt includes all top-level item rows in the structured item evidence context

#### Scenario: Prompt avoids first-item dominance
- **WHEN** structured item evidence exists and the legacy item description contains a detailed first item
- **THEN** prompt assembly does not present that legacy first-item description as the main item evidence field

#### Scenario: Prompt includes evidence diagnostics
- **WHEN** structured item evidence is partial, contaminated, or unavailable
- **THEN** prompt assembly includes compact diagnostics that identify the evidence quality and fallback behavior

### Requirement: Document generation MUST apply document-specific item evidence detail levels
The system MUST format structured item evidence according to the requested document type so each document receives enough evidence for its role without forcing inappropriate item-level drafting.

#### Scenario: DFD receives administrative evidence
- **WHEN** the requested document type is `dfd`
- **THEN** the prompt includes top-level item labels and compact component evidence sufficient for a cohesive high-level object description without requiring exhaustive component prose

#### Scenario: TR receives operational evidence
- **WHEN** the requested document type is `tr`
- **THEN** the prompt includes richer item/component evidence suitable for specifications, delivery, receiving, conformity, and fiscalization sections

#### Scenario: Minuta receives contractual evidence
- **WHEN** the requested document type is `minuta`
- **THEN** the prompt includes enough item evidence to preserve the contractual object and execution scope without transforming the minuta into a TR
