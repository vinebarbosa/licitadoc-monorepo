## ADDED Requirements

### Requirement: Document generation MUST use document-facing process type labels
The system MUST convert stored process type values into human-readable document labels before assembling document-generation context. Generated document prompts MUST NOT expose raw process type slugs such as `licitacao` when a canonical Portuguese label is known.

#### Scenario: DFD context uses a readable process type
- **WHEN** an authorized actor requests a DFD draft for a stored process whose type is `licitacao`
- **THEN** the generation context uses `Licitação` as the process type label before invoking the provider

#### Scenario: Stored process value remains unchanged
- **WHEN** document generation normalizes a process type for prompt context
- **THEN** the stored process record and process API value remain unchanged

#### Scenario: Unknown process type is safely humanized
- **WHEN** document generation receives an unknown slug-like process type value
- **THEN** the generation context uses a readable fallback label instead of the raw slug formatting
