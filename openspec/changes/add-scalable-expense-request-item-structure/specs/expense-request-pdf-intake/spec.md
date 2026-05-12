## ADDED Requirements

### Requirement: Expense request PDF intake MUST preserve parseable text boundaries
Expense request PDF intake MUST preserve enough machine-readable page, line, and item-section boundaries for the SD parser to reconstruct item table structure when the PDF text layer contains those signals.

#### Scenario: PDF item table remains parseable
- **WHEN** an uploaded SD PDF contains machine-readable item rows across multiple pages
- **THEN** PDF extraction preserves page/line boundaries sufficiently for text intake to identify item rows and components
- **AND** it does not unnecessarily flatten the entire item table into one continuous paragraph before parsing

#### Scenario: PDF extraction remains deterministic
- **WHEN** an uploaded SD PDF is machine-readable
- **THEN** the extraction step remains deterministic and does not use generative guessing to reconstruct missing item structure

