## Why

Developers need to exercise real document generation locally without spending OpenAI quota or depending on external network/API credentials. The dev runtime should be able to route the existing provider-agnostic generation flow to a local Ollama model, specifically `qwen3.6:35b`, while preserving the production OpenAI path.

## What Changes

- Add an Ollama-backed text generation adapter that satisfies the existing provider-agnostic `TextGenerationProvider` contract.
- Allow runtime configuration to select `TEXT_GENERATION_PROVIDER=ollama`, `TEXT_GENERATION_MODEL=qwen3.6:35b`, and a configurable Ollama base URL for local development.
- Make dev setup documentation or examples point local generation at Ollama instead of OpenAI when developers opt into real local generation.
- Normalize Ollama response shapes, HTTP failures, empty responses, and timeouts into the same application-level generation errors used by the current provider layer.
- Keep OpenAI available for environments that explicitly configure it; no production provider behavior is removed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `generation-provider`: The runtime-selected generation provider now includes an Ollama adapter suitable for local development with `qwen3.6:35b`.

## Impact

- Affected API code: `apps/api/src/shared/text-generation`, provider resolution, environment schema, provider tests, and local dev environment examples/docs.
- Affected systems: local Ollama service on the developer machine, expected at a configurable base URL such as `http://127.0.0.1:11434`.
- No API route contract or generated web client changes are expected because the public document-generation API remains provider-neutral.
