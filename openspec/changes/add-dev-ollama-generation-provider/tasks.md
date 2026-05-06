## 1. Provider Configuration

- [x] 1.1 Extend API environment parsing with a configurable text-generation base URL for local providers.
- [x] 1.2 Update provider resolution so `TEXT_GENERATION_PROVIDER=ollama` returns an Ollama-backed adapter while preserving `stub` and `openai`.
- [x] 1.3 Add local development documentation or examples showing `TEXT_GENERATION_PROVIDER=ollama`, `TEXT_GENERATION_MODEL=qwen3.6:35b`, and the Ollama base URL.

## 2. Ollama Adapter

- [x] 2.1 Implement `OllamaTextGenerationProvider` using the existing `TextGenerationProvider` contract.
- [x] 2.2 Send the existing normalized prompt to Ollama with non-streaming generation and return normalized `providerKey`, `model`, `text`, and `responseMetadata`.
- [x] 2.3 Normalize Ollama HTTP errors, connection failures, timeouts, rejected model requests, and empty responses into existing `TextGenerationError` categories.

## 3. Tests

- [x] 3.1 Add unit tests for provider resolution with `ollama`, including model and base URL handling.
- [x] 3.2 Add unit tests for successful Ollama response parsing and metadata normalization.
- [x] 3.3 Add unit tests for Ollama timeout, unavailable service, rejected request, and empty response normalization.

## 4. Verification

- [x] 4.1 Run focused text-generation provider tests.
- [x] 4.2 Run API typecheck.
- [x] 4.3 Run Biome check on changed API/docs files.
