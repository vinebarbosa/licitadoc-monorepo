## 1. Ollama Streaming Implementation

- [x] 1.1 Change the Ollama `/api/generate` request body to send `stream: true`.
- [x] 1.2 Replace single `response.json()` parsing with a `ReadableStream` reader that decodes NDJSON chunks incrementally.
- [x] 1.3 Buffer incomplete JSON lines across transport reads and parse the final buffered line before completing.
- [x] 1.4 Accumulate streamed `response` fragments in order and return the trimmed final text through the existing `TextGenerationResult` contract.
- [x] 1.5 Capture final Ollama metadata from the latest parsed chunks, including `done`, `total_duration`, `load_duration`, `prompt_eval_count`, and `eval_count`.
- [x] 1.6 Remove the total elapsed `AbortController` timeout behavior for active Ollama streams while preserving provider configuration compatibility.
- [x] 1.7 Preserve normalized failures for non-OK HTTP responses, stream `error` chunks, missing stream body, malformed stream data, connection failures, and empty final text.

## 2. Tests

- [x] 2.1 Update the successful Ollama provider test to assert `stream: true`, streamed text composition, and final metadata.
- [x] 2.2 Add coverage for NDJSON lines split across multiple transport chunks.
- [x] 2.3 Add coverage proving an active stream can continue past the configured timeout and complete successfully.
- [x] 2.4 Add or update coverage for Ollama stream error chunks.
- [x] 2.5 Update empty response and unavailable body tests for the streaming response shape.

## 3. Validation

- [x] 3.1 Run the focused API text generation test suite.
- [x] 3.2 Run the relevant API typecheck or broader test command if available in the workspace.
