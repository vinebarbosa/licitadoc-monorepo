## ADDED Requirements

### Requirement: Ollama provider MUST disable thinking output for document generation streams
The Ollama-backed generation provider MUST request streamed document-generation output with provider thinking disabled so realtime document text is emitted through the normalized `response` stream. The provider MUST NOT publish or persist Ollama `thinking` content as generated document text.

#### Scenario: Ollama request disables thinking while streaming
- **WHEN** the Ollama provider invokes `/api/generate` for a document-generation request
- **THEN** the request body includes `stream: true`
- **AND** the request body includes `think: false`

#### Scenario: Response chunks are published without waiting for thinking output
- **WHEN** Ollama returns streamed JSON chunks with non-empty `response` fragments
- **THEN** the provider invokes the incremental chunk callback for each non-empty `response` fragment in order
- **AND** the provider does not require any `thinking` content before publishing visible document text

#### Scenario: Thinking chunks are not treated as document content
- **WHEN** Ollama returns streamed JSON chunks where `thinking` is present and `response` is empty
- **THEN** the provider does not append the `thinking` value to the normalized generated text
- **AND** the provider does not publish that `thinking` value through the incremental chunk callback
