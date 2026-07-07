## ADDED Requirements

### Requirement: Generation runs provide auditable AI usage metadata
The system SHALL persist document-generation run metadata that can be used as the auditable source for administrative AI usage reporting. Successful generation runs MUST preserve provider, model, status, document type, organization context, known cost in USD, token totals, cached input tokens, call count, and per-call details when the provider pipeline supplies them. Unknown cost MUST remain distinguishable from zero cost.

#### Scenario: Successful run persists usage metadata
- **WHEN** a document generation run completes successfully with provider usage metadata
- **THEN** the stored generation run metadata includes enough cost, token, model, provider, document type, and organization information for admin usage aggregation

#### Scenario: Cost cannot be calculated
- **WHEN** a generation provider or model does not expose known pricing for a run
- **THEN** the stored generation run metadata preserves token usage when available and represents monetary cost as unknown instead of zero

#### Scenario: Pipeline uses multiple calls
- **WHEN** a document generation pipeline performs multiple provider calls for one document
- **THEN** the stored generation run metadata keeps per-call usage and an aggregate total for administrative reporting
