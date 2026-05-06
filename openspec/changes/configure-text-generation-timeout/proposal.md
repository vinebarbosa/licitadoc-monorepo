## Why

Text generation provider requests currently use hard-coded timeout windows: 90 seconds for OpenAI and 10 minutes for Ollama. Long procurement document prompts can exceed the OpenAI window, causing background generation runs to fail even when the provider would eventually return useful content.

## What Changes

- Add runtime configuration for the text generation provider timeout.
- Apply the configured timeout to supported text generation providers instead of hard-coding provider-specific values in each adapter.
- Preserve current default behavior when no timeout environment value is provided.
- Keep timeout failures normalized as provider-level `timeout` errors for generation-run persistence and troubleshooting.
- Document the new environment variable in API environment examples.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `generation-provider`: provider execution timeout becomes runtime-configurable while retaining controlled timeout failure behavior.

## Impact

- Affected API configuration: `apps/api/src/plugins/env.ts` and `apps/api/.env.example`.
- Affected provider code: `apps/api/src/shared/text-generation/openai-provider.ts`, `apps/api/src/shared/text-generation/ollama-provider.ts`, and provider resolution.
- Affected tests: text generation provider unit tests and configuration/provider resolution coverage.
- No public HTTP API contract or database migration is expected.
