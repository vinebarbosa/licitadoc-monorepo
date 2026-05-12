## ADDED Requirements

### Requirement: Generation providers MUST support optional incremental text callbacks
The shared generation provider contract MUST allow internal callers to pass an optional callback that receives generated text deltas while preserving the existing final `TextGenerationResult` return value.

#### Scenario: Streaming provider emits deltas and final result
- **WHEN** a streaming-capable provider such as Ollama receives a generation request with an incremental text callback
- **THEN** the provider invokes the callback with generated text fragments as they are received
- **AND** the provider still resolves with the complete normalized generation result when generation finishes

#### Scenario: Provider does not emit intermediate chunks
- **WHEN** a provider cannot produce intermediate text deltas
- **THEN** the provider still satisfies the shared generation contract by returning the complete normalized generation result
- **AND** document generation does not require vendor-specific branching to complete the draft

#### Scenario: Incremental callback receives only generated text
- **WHEN** a provider emits incremental progress through the callback
- **THEN** each callback payload includes generated text delta content and generic provider metadata when available
- **AND** the callback does not expose raw vendor-specific stream objects to document workflow consumers
