## ADDED Requirements

### Requirement: Generation providers MUST support optional planning progress callbacks
The shared generation provider contract MUST allow internal callers to pass an optional callback that receives non-document planning or thinking deltas separately from generated document text deltas. Planning progress MUST NOT be treated as generated document content.

#### Scenario: Provider emits planning and generated text separately
- **WHEN** a provider receives a generation request with both generated-text and planning-progress callbacks
- **AND** the provider stream contains planning progress followed by generated text
- **THEN** the provider invokes the planning-progress callback for planning deltas
- **AND** the provider invokes the generated-text callback only for generated document text deltas

#### Scenario: Provider does not support planning progress
- **WHEN** a provider cannot emit planning or thinking deltas
- **THEN** the provider still satisfies the shared generation contract by emitting generated text deltas when available and returning the complete normalized result

#### Scenario: Planning progress is excluded from final result text
- **WHEN** a provider emits planning progress during generation
- **THEN** the final normalized result text does not include planning progress content
- **AND** generated document text remains composed only from final response content

### Requirement: Ollama provider MUST keep thinking enabled for document generation streams
The Ollama-backed generation provider MUST NOT force thinking off for document-generation streams. When Ollama emits `thinking` deltas, the provider MUST expose them as planning progress while preserving `response` deltas as generated document text.

#### Scenario: Ollama request does not disable thinking
- **WHEN** the Ollama provider invokes `/api/generate` for a document-generation request
- **THEN** the request body includes `stream: true`
- **AND** the request body does not include `think: false`

#### Scenario: Ollama thinking chunks become planning progress
- **WHEN** Ollama returns streamed JSON chunks with non-empty `thinking` and empty `response`
- **THEN** the provider invokes the planning-progress callback with the `thinking` delta
- **AND** the provider does not invoke the generated-text callback for that chunk

#### Scenario: Ollama response chunks remain generated document text
- **WHEN** Ollama returns streamed JSON chunks with non-empty `response`
- **THEN** the provider invokes the generated-text callback with the `response` delta
- **AND** the provider appends the `response` delta to the final normalized result text
