## Context

The API already exposes document generation through a provider-neutral `TextGenerationProvider` contract and resolves the active adapter from runtime configuration. The current concrete adapters are `stub` and `openai`; real local generation still requires configuring OpenAI credentials, which is not ideal for development loops.

Ollama exposes a local HTTP API, commonly at `http://127.0.0.1:11434`, and can run local model tags such as `qwen3.6:35b`. This fits the existing provider abstraction because the document module already passes a normalized prompt and expects normalized generated text.

## Goals / Non-Goals

**Goals:**

- Add `ollama` as a supported `TEXT_GENERATION_PROVIDER` value.
- Allow development configuration to target Ollama with `TEXT_GENERATION_MODEL=qwen3.6:35b`.
- Keep the public document-generation API provider-neutral and unchanged.
- Normalize Ollama success, empty response, HTTP failure, timeout, and connection failure behavior into the existing text-generation result/error shapes.
- Document or provide examples for local dev configuration so developers do not accidentally spend OpenAI quota while testing generation.

**Non-Goals:**

- Remove or deprecate the OpenAI adapter.
- Add model pulling, Ollama installation, or process management to the app.
- Add multi-provider fallback or automatic provider selection per request.
- Change document prompt recipes or generated document sanitization.

## Decisions

1. Implement a first-class `OllamaTextGenerationProvider`.

   The adapter should live beside `openai-provider.ts` and `stub-provider.ts`, implement `TextGenerationProvider`, and be resolved by `resolveTextGenerationProvider` when `TEXT_GENERATION_PROVIDER=ollama`. This preserves the existing architecture and keeps document services free of vendor-specific branching. A one-off dev-only branch in the document worker was rejected because it would weaken the provider boundary.

2. Use Ollama's non-streaming generate endpoint.

   The provider should send the existing prompt to Ollama with `stream: false` and read the completed generated text from the non-streaming response. This maps cleanly to the current provider contract, which returns one final `text` string. Streaming was considered, but the product does not currently expose partial document output and the asynchronous generation worker already waits for completion.

3. Add a provider base URL setting.

   Add a generic setting such as `TEXT_GENERATION_BASE_URL`, defaulting to `http://127.0.0.1:11434` when the Ollama provider is selected. Keeping the name generic avoids hard-coding `OLLAMA_*` into the provider resolver while still letting local dev point at a different Ollama host if needed.

4. Keep defaults safe for tests and explicit for real generation.

   The `stub` provider can remain the no-credentials default for automated tests and fresh environments. Dev documentation or examples should show the real-local-generation setup:

   ```bash
   TEXT_GENERATION_PROVIDER=ollama
   TEXT_GENERATION_MODEL=qwen3.6:35b
   TEXT_GENERATION_BASE_URL=http://127.0.0.1:11434
   ```

   Automatically switching every development boot to Ollama was rejected because it would make `pnpm dev` fail on machines without Ollama or without the model pulled.

5. Normalize metadata and failures consistently.

   Successful Ollama runs should record `providerKey: "ollama"`, the resolved model, and lightweight response metadata such as `done`, `total_duration`, or other primitive response fields when available. HTTP 4xx should map to `invalid_request`, unavailable Ollama/connectivity/server errors to `provider_unavailable`, aborts to `timeout`, and empty generated text to `provider_unavailable`.

## Risks / Trade-offs

- [Local model missing] -> The provider returns a normalized failure with enough details to indicate Ollama rejected the model request; docs tell developers to pull the model before use.
- [Large local model is slow] -> Keep generation asynchronous and retain timeout handling; developers can choose another model by changing `TEXT_GENERATION_MODEL` if needed.
- [Ollama response shape changes] -> Parse only the stable final text field and store metadata defensively.
- [Development defaults become surprising] -> Keep `stub` as the generic default and document Ollama as the real local-generation configuration.

## Migration Plan

1. Add the Ollama provider implementation and resolver support.
2. Extend environment config with a base URL setting and local dev documentation/examples.
3. Add unit coverage for provider resolution, successful Ollama response parsing, and normalized failures.
4. Run API typecheck and focused text-generation tests.

## Open Questions

- None. The requested local model tag is `qwen3.6:35b` and should be treated as the documented dev example while remaining configurable.
