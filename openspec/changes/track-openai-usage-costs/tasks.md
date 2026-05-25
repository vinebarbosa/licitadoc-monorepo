## 1. OpenAI Usage and Cost Metadata

- [x] 1.1 Add a focused text-generation usage/cost utility that normalizes OpenAI usage fields and prices non-cached input, cached input, and output tokens per model.
- [x] 1.2 Cover the cost utility with tests for normal input tokens, cached input tokens, output tokens, missing usage defaults, and unknown model pricing.
- [x] 1.3 Extend `OpenAiTextGenerationProvider` response parsing to include `usage` and `costUsd` in `responseMetadata` while preserving existing `responseId` and `status`.
- [x] 1.4 Update OpenAI provider tests to validate normalized usage parsing, optional detail defaults, per-call cost, unknown model cost handling, and continued incremental callback compatibility.

## 2. Pipeline Call Accounting

- [x] 2.1 Add pipeline call metadata collection for successful `writer`, `humanization`, and `rewrite` provider calls without changing prompts or generated text flow.
- [x] 2.2 Extend pipeline response metadata so `responseMetadata.pipeline.calls` includes stage, model, providerKey, responseId, usage, and costUsd for each successful call.
- [x] 2.3 Add aggregate pipeline metadata fields: `totalInputTokens`, `totalCachedInputTokens`, `totalOutputTokens`, `totalTokens`, `totalCostUsd`, and `callCount`.
- [x] 2.4 Preserve existing top-level final-call metadata and existing `responseMetadata.pipeline` summary/debug fields.
- [x] 2.5 Ensure stub and Ollama provider results without usage continue to produce stable pipeline metadata.

## 3. Persistence and Compatibility

- [x] 3.1 Keep the new accounting data in the existing `document_generation_runs.response_metadata` JSONB payload unless implementation discovers a strong need for new columns.
- [x] 3.2 If new columns become necessary, generate and include the database migration with `pnpm --filter @licitadoc/api db:generate`.
- [x] 3.3 Confirm the implementation does not log API keys or add provider secrets to metadata, errors, or test snapshots.

## 4. Tests and Validation

- [x] 4.1 Update `document-generation-pipeline` tests to assert writer + humanization + rewrite call accumulation and aggregate totals.
- [x] 4.2 Run `pnpm --filter @licitadoc/api test -- text-generation`.
- [x] 4.3 Run `pnpm --filter @licitadoc/api test -- document-generation-pipeline`.
- [x] 4.4 Run `pnpm --filter @licitadoc/api typecheck`.
- [x] 4.5 If a targeted Vitest command does not match files as expected, run `pnpm --filter @licitadoc/api test`.
