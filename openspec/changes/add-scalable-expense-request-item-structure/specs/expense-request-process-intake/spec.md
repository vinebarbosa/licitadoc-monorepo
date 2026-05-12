## ADDED Requirements

### Requirement: Expense request intake MUST preserve structured item evidence
Expense request text intake MUST persist structured SD item evidence in source metadata when the submitted SD text contains item table structure. The system MUST keep the legacy representative `item` field for compatibility, but document generation MUST be able to read all parsed line items and components.

#### Scenario: SD text with several line items creates structured metadata
- **WHEN** an authorized actor submits SD text containing multiple item rows, quantities, units, values, or component lists
- **THEN** the created process source metadata includes structured item evidence for all reliably parsed line items
- **AND** the process still includes the legacy representative `item` field

#### Scenario: Kit escolar text does not collapse to first kit only
- **WHEN** SD text contains multiple school-kit rows and internal school-supply components
- **THEN** intake preserves the kit rows and component labels as structured metadata
- **AND** it does not store only the Educação Infantil kit as the usable item evidence

### Requirement: Expense request intake MUST classify item text roles without inventing data
Expense request text intake MUST classify parsed item fragments as line item labels, component labels, or descriptive attributes when reliable structural signals exist. It MUST record warnings when structure is ambiguous and MUST NOT fabricate items, quantities, values, or categories.

#### Scenario: Packaging phrase remains an attribute
- **WHEN** an item description contains a sentence such as "a embalagem deve conter..." as part of a specification
- **THEN** intake treats that phrase as an attribute or supporting detail
- **AND** it does not create a line item or semantic group named "embalagem" from that phrase

#### Scenario: Ambiguous structure emits warnings
- **WHEN** the parser cannot reliably distinguish item labels from descriptive details
- **THEN** intake records a warning in source metadata
- **AND** it falls back to conservative representative item text without inventing a structured item list

