## Context

Document generation uses a provider-agnostic `TextGenerationProvider` contract. The OpenAI adapter currently calls the Responses API and returns `responseMetadata` with only `responseId` and `status`. The strict document pipeline may call the provider multiple times for writer, humanization, and up to two rewrite passes, but `executeDocumentGenerationPipeline` currently persists metadata from only the final provider result while preserving a `pipeline` summary/debug object.

The existing `document_generation_runs.response_metadata` JSONB field is sufficient for this audit data. The change should stay concentrated in the text-generation provider/util layer, the pipeline metadata assembly, and focused tests.

## Goals / Non-Goals

**Goals:**
- Normalize OpenAI Responses API `usage` into stable metadata fields.
- Calculate per-call USD cost for known OpenAI models, including cached input token pricing.
- Preserve current top-level final-call metadata such as `responseId` and `status`.
- Add full pipeline call metadata and aggregate token/cost totals without removing existing `responseMetadata.pipeline` summary/debug fields.
- Keep stub and Ollama providers working when usage/cost metadata is absent.

**Non-Goals:**
- Do not change prompts, review rules, or generated document text.
- Do not add database columns unless implementation proves JSONB cannot satisfy the requirement.
- Do not log request bodies, prompts beyond existing behavior, or API keys.
- Do not make non-OpenAI providers simulate usage data.

## Decisions

1. **Keep persistence inside `response_metadata` JSONB.**
   The required data is run-specific and naturally nested. Reusing JSONB avoids a migration and keeps historical provider metadata together. Adding relational columns was rejected because no query/reporting requirement currently demands indexed cost fields.

2. **Normalize usage at the OpenAI provider boundary.**
   `openai-provider.ts` should parse the Responses API body into a small metadata shape before returning `TextGenerationResult`. Token counts should be numeric and predictable: missing token counts become `0`; missing `responseId` and `status` become `null`; missing `total_tokens` can fall back to `input_tokens + output_tokens`.

3. **Add a focused OpenAI cost utility.**
   A utility should accept `{ model, usage }` and return `costUsd`. It should price non-cached input tokens, cached input tokens, and output tokens separately using per-million-token rates. Unknown models should return `null` rather than pretending the call was free; missing/zero usage for a known model should return `0`.

4. **Store the full strict-pipeline audit trail under `responseMetadata.pipeline.calls`.**
   The pipeline already owns `responseMetadata.pipeline`, so adding `calls` and aggregate totals there keeps debug metadata and call accounting in one place. Each call entry should include `stage`, `model`, `providerKey`, `responseId`, `usage`, and `costUsd`. The existing top-level spread of the final provider metadata remains for backward compatibility.

5. **Aggregate from normalized call entries.**
   Pipeline totals should be derived from the call array, not manually incremented in separate branches. This keeps writer, humanization, and rewrite handling consistent, including failed/skipped humanization where no successful call exists. `totalCostUsd` should be `null` if any included call has an unknown cost; otherwise it is the sum of call costs.

## Risks / Trade-offs

- [Pricing table can become stale] -> Keep the cost utility isolated and covered by tests so model pricing can be updated in one file.
- [Unknown model cost could be misread] -> Return `null` for unknown model pricing while preserving token totals.
- [Metadata shape could break existing consumers] -> Preserve existing top-level `responseId`/`status` and existing `pipeline` summary/debug fields, only adding new keys.
- [Providers without usage could fail aggregation] -> Normalize missing usage to zero-valued usage objects and nullable cost fields before aggregation.

## Migration Plan

Implement behind the existing provider and pipeline contracts, with no database migration expected. Existing rows remain readable; new rows receive richer JSONB metadata. Rollback is a code revert because no schema change is planned.

## Open Questions

- Which exact OpenAI model IDs beyond the default `gpt-4.1-mini` should be seeded in the initial pricing table?
