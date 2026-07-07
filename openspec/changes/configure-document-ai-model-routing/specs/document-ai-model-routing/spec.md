## ADDED Requirements

### Requirement: Full document generation MUST use the selected quality model
The system MUST route full procurement document generation through the configured full-document generation model. For the current OpenAI configuration, that model MUST be `gpt-5.4`.

#### Scenario: Full DFD generation uses gpt-5.4
- **WHEN** an authorized actor requests generation of a supported procurement document
- **THEN** the full document generation provider invocation uses model `gpt-5.4`

#### Scenario: Generation metadata records the full-document model
- **WHEN** a full document generation run completes or fails after invoking the provider
- **THEN** persisted run metadata records the actual full-document model used

### Requirement: Document editor adjustments MUST use the selected editor model
The system MUST route AI-assisted text adjustment from the document editor through the configured editor adjustment model. For the current OpenAI configuration, that model MUST be `gpt-4.1-mini`.

#### Scenario: Editor adjustment suggestion uses gpt-4.1-mini
- **WHEN** an authorized actor requests an AI suggestion for selected text in the document editor
- **THEN** the text adjustment provider invocation uses model `gpt-4.1-mini`

#### Scenario: Editor adjustment does not change the full generation model
- **WHEN** the editor adjustment model is configured as `gpt-4.1-mini`
- **THEN** full procurement document generation still uses `gpt-5.4`

### Requirement: Model routing MUST remain configurable by deployment
The system MUST keep full-document and editor-adjustment model selection in runtime configuration so future model decisions can be changed without modifying document business logic.

#### Scenario: Runtime configuration exposes separate model settings
- **WHEN** the API starts
- **THEN** it resolves a full-document generation model and a document editor adjustment model as separate runtime settings

#### Scenario: Shared provider credentials are reused
- **WHEN** both full-document generation and editor adjustment use OpenAI
- **THEN** both flows use the same configured provider credentials and provider behavior while selecting their purpose-specific models
