## ADDED Requirements

### Requirement: OpenAI provider metadata MUST include normalized usage and cost
The OpenAI text generation adapter MUST parse Responses API usage into `responseMetadata` and MUST include `responseId`, `status`, `usage`, and `costUsd` for successful calls. The `usage` object MUST include `input_tokens`, `output_tokens`, `total_tokens`, `input_tokens_details.cached_tokens`, and `output_tokens_details.reasoning_tokens`. Missing response identifiers and statuses MUST be stored as `null`; missing token counts MUST be stored as `0`; missing `total_tokens` MUST fall back to the sum of input and output tokens.

#### Scenario: OpenAI response includes token usage
- **WHEN** the OpenAI Responses API returns a successful response with `id`, `status`, and populated `usage`
- **THEN** the provider result includes normalized `responseMetadata.responseId`, `responseMetadata.status`, `responseMetadata.usage`, and a numeric `responseMetadata.costUsd` for a priced model

#### Scenario: OpenAI response omits optional token details
- **WHEN** the OpenAI Responses API returns usage without cached input token details or reasoning token details
- **THEN** the provider result stores `usage.input_tokens_details.cached_tokens` as `0` and `usage.output_tokens_details.reasoning_tokens` as `0`

#### Scenario: OpenAI model pricing is unknown
- **WHEN** a successful OpenAI response uses a model that has no configured price
- **THEN** the provider result keeps normalized token usage and stores `costUsd` as `null`

#### Scenario: OpenAI response omits usage
- **WHEN** the OpenAI Responses API returns a successful response without `usage`
- **THEN** the provider result remains successful and stores a zero-valued normalized `usage` object with predictable `costUsd`

### Requirement: Non-OpenAI providers MUST remain compatible without usage metadata
The shared text-generation contract MUST allow providers that do not expose token usage to keep returning provider-specific metadata without requiring OpenAI usage or cost fields.

#### Scenario: Stub or Ollama provider returns provider-specific metadata
- **WHEN** a non-OpenAI provider returns a successful generation result without token usage
- **THEN** document generation accepts the result and does not require OpenAI-specific metadata fields
