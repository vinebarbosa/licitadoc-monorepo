## Why

Generated documents can require several OpenAI calls, but the stored metadata currently only reflects the last provider result. This makes it impossible to audit token usage, cached-token savings, and USD cost for a complete document generation run.

## What Changes

- Capture normalized OpenAI Responses API `usage` fields in provider `responseMetadata`, including `responseId`, `status`, token counts, cached input tokens, and reasoning output tokens with predictable defaults when provider fields are missing.
- Calculate USD cost for each OpenAI call from normalized usage and the model pricing table, returning a safe value for unknown models.
- Preserve provider compatibility for stub and Ollama by keeping metadata optional and provider-agnostic when usage is unavailable.
- Accumulate document pipeline text-generation calls for `writer`, `humanization`, and up to two `rewrite` passes under `responseMetadata.pipeline.calls` or `responseMetadata.textGeneration.calls`.
- Store aggregate call count, input tokens, cached input tokens, output tokens, total tokens, and total USD cost in the same `response_metadata` JSONB payload.
- Keep the existing pipeline debug metadata and existing top-level `responseId`/`status` behavior intact.

## Capabilities

### New Capabilities

### Modified Capabilities
- `generation-provider`: Provider execution metadata MUST include normalized OpenAI usage and per-call cost when available, without breaking providers that do not expose usage.
- `document-generation`: Stored document generation metadata MUST retain every pipeline text-generation call and aggregate usage/cost across the full document run.

## Impact

- Affects the API text generation provider contract implementation, OpenAI provider metadata parsing, and a focused cost utility.
- Affects the document generation pipeline metadata assembly and persistence through the existing `document_generation_runs.response_metadata` JSONB field.
- Affects tests for `OpenAiTextGenerationProvider`, the cost utility, and `document-generation-pipeline`.
- No database migration is expected unless implementation discovers the existing JSONB payload is insufficient.
