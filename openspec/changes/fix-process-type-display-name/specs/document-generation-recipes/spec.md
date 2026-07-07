## ADDED Requirements

### Requirement: DFD recipe placeholders MUST avoid raw process type values
The DFD recipe and its assembled prompt context MUST use the normalized process type label for document-facing fields. The canonical DFD model MUST NOT instruct the model to render `process.type` directly when that value can be a stored slug.

#### Scenario: DFD template receives normalized process type
- **WHEN** the backend prepares the canonical DFD recipe and template for prompt assembly
- **THEN** any process type field provided to the model is the normalized display label rather than the raw stored process type

#### Scenario: Raw process type slug does not appear in assembled prompt
- **WHEN** the stored process type is `licitacao`
- **THEN** the assembled DFD prompt does not contain `Processo: licitacao` or an equivalent raw process type placeholder intended for final rendering
