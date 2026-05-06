## 1. Runtime configuration

- [x] 1.1 Add `TEXT_GENERATION_TIMEOUT_MS` to API environment validation as an optional positive integer.
- [x] 1.2 Document `TEXT_GENERATION_TIMEOUT_MS` in `apps/api/.env.example` with an example value.
- [x] 1.3 Pass the parsed timeout from the text generation Fastify plugin into provider resolution.

## 2. Provider timeout wiring

- [x] 2.1 Extend provider resolution to accept an optional timeout value and pass it to supported adapters.
- [x] 2.2 Update the OpenAI provider to use the configured timeout or fall back to its existing 90-second default.
- [x] 2.3 Update the Ollama provider to use the configured timeout or fall back to its existing 10-minute default.
- [x] 2.4 Preserve normalized `timeout` errors when configured or default timeouts abort provider requests.

## 3. Tests and verification

- [x] 3.1 Update text generation provider tests for configured timeout behavior and default fallback behavior.
- [x] 3.2 Add or adjust configuration/provider resolution coverage for invalid timeout values.
- [x] 3.3 Run the focused API text-generation tests.
- [x] 3.4 Run API typecheck or the closest scoped validation for touched files.
- [x] 3.5 Run OpenSpec status for `configure-text-generation-timeout` and confirm artifacts are complete.
