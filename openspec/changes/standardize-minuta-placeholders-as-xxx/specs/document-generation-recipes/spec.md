## ADDED Requirements

### Requirement: Minuta recipe fallbacks MUST use document-facing placeholder text
The Minuta recipe and Minuta prompt context MUST use document-facing placeholder text for missing contractual fields. They MUST NOT present unresolved internal mustache fallback tokens as the value to copy into the final contract.

#### Scenario: Missing dotacao in Minuta prompt context
- **WHEN** the Minuta prompt context is assembled without budget allocation data
- **THEN** the dotacao fallback shown to the Writer is `XXX`-style placeholder text rather than `{{budget.allocation_or_placeholder}}`

#### Scenario: Missing organization or contractor fields
- **WHEN** the Minuta prompt context is assembled without required party, address, representative, date, or number fields
- **THEN** those fields use contractual placeholders such as `XXX`, `XXX/2026`, `XX/XX/XXXX`, `[CONTRATADA]`, or equivalent human-facing placeholder text

### Requirement: Minuta templates MUST NOT leak raw render tokens into final documents
The Minuta template MAY use internal render markers as structural guidance, but final generated documents MUST NOT preserve those markers. Tests MUST guard the Minuta template and sanitizer path against raw `{{...}}` leakage.

#### Scenario: Template marker is copied by the model
- **WHEN** the Writer copies a template marker into a Minuta draft
- **THEN** final sanitization converts the marker to document-facing placeholder text before persistence

#### Scenario: RH assessoria Minuta follows reference placeholder style
- **WHEN** the RH assessoria Minuta scenario is generated with absent budget allocation, contractor, dates, or price details
- **THEN** the output uses the reference PDF style of `XXX`-like placeholders and contains no `{{...}}` token
