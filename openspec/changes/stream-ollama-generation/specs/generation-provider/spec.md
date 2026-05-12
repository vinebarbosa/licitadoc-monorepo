## ADDED Requirements

### Requirement: Ollama provider MUST consume streaming generation responses
The Ollama-backed generation provider MUST call Ollama `/api/generate` with streaming enabled and MUST consume the line-delimited JSON stream until the final `done` chunk before returning the normalized generation result.

#### Scenario: Streaming chunks are composed into one result
- **WHEN** Ollama returns multiple streaming JSON chunks with partial `response` values followed by a final `done` chunk
- **THEN** the provider returns a single normalized `TextGenerationResult`
- **AND** the result text contains the streamed `response` fragments in order
- **AND** the result metadata includes final Ollama metadata when present

#### Scenario: Streaming JSON arrives split across transport chunks
- **WHEN** a streamed Ollama JSON line is split across more than one transport read
- **THEN** the provider buffers the partial line until it can parse the complete JSON object
- **AND** the provider includes that parsed chunk in the final accumulated result

#### Scenario: Ollama emits an error chunk
- **WHEN** Ollama returns a streaming JSON chunk containing an `error` value
- **THEN** the provider fails the generation with a normalized provider error
- **AND** the failure includes the Ollama error details without leaking an unhandled stream parsing exception

### Requirement: Ollama provider MUST NOT timeout active streaming generations by total elapsed time
The Ollama-backed generation provider MUST NOT abort an active generation solely because the configured text generation timeout elapsed while the stream is still producing chunks.

#### Scenario: Long active stream exceeds configured timeout
- **WHEN** the configured text generation timeout elapses while an Ollama stream is still producing valid chunks
- **THEN** the provider continues reading the stream instead of aborting the request as a timeout
- **AND** the provider completes successfully when Ollama later sends the final `done` chunk with generated text

#### Scenario: Stream body is unavailable
- **WHEN** Ollama returns a successful HTTP response without a readable stream body
- **THEN** the provider fails with a normalized `provider_unavailable` error

#### Scenario: Stream completes without text
- **WHEN** Ollama completes the stream without any non-empty generated text
- **THEN** the provider fails with a normalized `provider_unavailable` error
