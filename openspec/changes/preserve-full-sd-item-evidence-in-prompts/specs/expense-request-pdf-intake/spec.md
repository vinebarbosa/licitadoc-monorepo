## ADDED Requirements

### Requirement: Expense request PDF intake MUST preserve item-table boundaries without page noise
The PDF intake workflow MUST extract machine-readable SD text in a way that preserves useful item-table boundaries while preventing repeated page headers, footers, address blocks, and pagination markers from becoming item evidence.

#### Scenario: Multi-page item table preserves row continuity
- **WHEN** an SD PDF item table spans multiple pages
- **THEN** extracted text preserves enough boundary information for the parser to associate continued components/specifications with the correct item rows

#### Scenario: Repeated headers are suppressed from item evidence
- **WHEN** each PDF page repeats municipal address, CNPJ, system title, or page number text
- **THEN** those repeated page artifacts do not appear as top-level item labels in structured item evidence

#### Scenario: PDF extraction remains deterministic
- **WHEN** an SD PDF contains machine-readable text
- **THEN** the system extracts and normalizes text deterministically without using generative reconstruction to infer missing item rows
