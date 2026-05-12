## 1. Ollama Provider Request

- [x] 1.1 Update the Ollama `/api/generate` request body to include `think: false` alongside `stream: true`.
- [x] 1.2 Preserve existing response parsing, accumulated text composition, metadata handling, and normalized error behavior.
- [x] 1.3 Keep `thinking` chunks excluded from normalized generated text and incremental callbacks.

## 2. Provider Tests

- [x] 2.1 Add or update a provider test asserting the Ollama request body includes `stream: true` and `think: false`.
- [x] 2.2 Add or update streaming tests asserting non-empty `response` fragments still invoke `onChunk` in order.
- [x] 2.3 Add or update coverage asserting chunks with only `thinking` and empty `response` are not published as document text.

## 3. Validation

- [x] 3.1 Run the focused text generation provider tests.
- [x] 3.2 Run the API typecheck.
- [x] 3.3 Run focused lint/format validation for touched API files.
