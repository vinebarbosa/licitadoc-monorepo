## Context

Document generation already depends on the provider-agnostic `TextGenerationProvider.generateText` contract. The document worker waits for a complete `TextGenerationResult`, sanitizes the returned draft, and persists the final run metadata.

The Ollama adapter currently posts to `/api/generate` with `stream: false`, waits for one JSON response, and wraps the whole request in an `AbortController` timer. That shape works for short drafts, but long document generations can exceed the configured elapsed timeout while Ollama is still actively producing output.

## Goals / Non-Goals

**Goals:**

- Use Ollama's native streaming mode by sending `stream: true`.
- Parse Ollama's newline-delimited JSON response incrementally.
- Accumulate streamed `response` fragments into the same final `TextGenerationResult.text` contract used today.
- Preserve normalized provider errors for HTTP failures, stream error chunks, empty output, and connection failures.
- Prevent active Ollama streams from being aborted solely because total elapsed wall-clock time crossed the configured timeout.

**Non-Goals:**

- Expose token-level streaming to the document worker or web UI.
- Change the document generation database model, run lifecycle, or API response shape.
- Change OpenAI provider timeout behavior.
- Add a new dependency for NDJSON parsing.

## Decisions

1. **Keep streaming internal to the Ollama adapter.**
   The adapter will still resolve `generateText` only after the full Ollama stream completes. This keeps the document worker, persistence, and sanitization flow unchanged while fixing the provider's transport behavior.

2. **Read the response body with a `ReadableStream` reader and `TextDecoder`.**
   Ollama streams one JSON object per line. The adapter will read chunks from `response.body.getReader()`, decode with streaming mode, buffer incomplete trailing lines, parse each complete line as JSON, and parse any final buffered line after `done`.

3. **Accumulate response text and capture final metadata.**
   Each parsed chunk may include a `response` fragment. The adapter will append fragments in order, trim the final assembled text, and use the final `done: true` chunk for metadata such as `total_duration`, `load_duration`, `prompt_eval_count`, and `eval_count`. If metadata appears on a later chunk, the latest parsed values win.

4. **Remove the total elapsed abort for active Ollama streams.**
   The Ollama request must not be cancelled just because `TEXT_GENERATION_TIMEOUT_MS` elapsed while chunks are still arriving. The existing `timeoutMs` property can remain for configuration compatibility, but the streaming implementation will avoid a whole-request `setTimeout` that aborts long active generations.

5. **Normalize errors at the same boundary as today.**
   Non-OK HTTP responses will still become `invalid_request` for 4xx and `provider_unavailable` for 5xx or service failures. A parsed stream chunk with `error` will become a provider error with details from the chunk. Missing `response.body`, malformed stream JSON, connection failures, and empty final text will remain normalized as provider-level failures.

## Risks / Trade-offs

- **Long inactive streams could hang longer than before** -> Keep this change scoped to removing the total elapsed abort for active generation; a future change can add a separate inactivity timeout if production evidence shows stalled sockets.
- **Malformed partial JSON could hide provider details** -> Include parse errors and the raw line in normalized failure details where safe.
- **Tests need to model Web Streams accurately** -> Add focused unit helpers that create `ReadableStream` instances with multiple chunks and split JSON lines so buffering behavior is covered.
- **Metadata may be absent until the final chunk** -> Treat metadata fields as nullable, matching the current normalized response shape.
