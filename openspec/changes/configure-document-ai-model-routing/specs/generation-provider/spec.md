## ADDED Requirements

### Requirement: Text generation provider resolution MUST support purpose-specific models
The system MUST be able to resolve text-generation providers for distinct document AI purposes while preserving the shared provider contract. Purpose-specific provider instances MUST use the configured model for that purpose and keep normalized output, usage, cost, and error behavior consistent.

#### Scenario: Resolve full document generation provider
- **WHEN** runtime configuration selects OpenAI as the text-generation provider and `gpt-5.4` as the full-document model
- **THEN** the resolved full document generation provider reports and invokes model `gpt-5.4`

#### Scenario: Resolve document adjustment provider
- **WHEN** runtime configuration selects OpenAI as the text-generation provider and `gpt-4.1-mini` as the editor adjustment model
- **THEN** the resolved document adjustment provider reports and invokes model `gpt-4.1-mini`

#### Scenario: Purpose-specific calls preserve normalized metadata
- **WHEN** either purpose-specific provider returns a result with usage details
- **THEN** the result includes the actual provider key, actual model, normalized usage, and calculated cost when pricing is known
