## Context

The API currently resolves one shared text-generation provider from `TEXT_GENERATION_PROVIDER` and `TEXT_GENERATION_MODEL`. Both full document generation and document text adjustment use that provider, even though they have different needs.

Recent DFD comparisons established a product decision: full procurement document generation should prioritize quality with `gpt-5.4`, while the document editor's focused text-adjustment workflow should prioritize cost and responsiveness with `gpt-4.1-mini`.

## Goals / Non-Goals

**Goals:**

- Route full document generation through `gpt-5.4`.
- Route editor text adjustment through `gpt-4.1-mini`.
- Keep provider credentials, provider key, timeout, base URL behavior, and normalized errors shared.
- Record the actual model used by each flow in existing generation metadata.
- Keep the implementation configurable so future model changes do not require touching document business logic.

**Non-Goals:**

- Reintroducing Gemini or Ollama-specific routing for this decision.
- Changing the document editor UI.
- Changing public document-generation or adjustment request/response schemas.
- Backfilling historical generation run metadata.

## Decisions

### Decision: Use purpose-specific model configuration

Add a separate runtime model setting for document text adjustment, defaulting to `gpt-4.1-mini`, while keeping the primary document-generation model as `gpt-5.4`. The implementation can name this setting around the adjustment/editor purpose, for example `TEXT_ADJUSTMENT_MODEL` or `DOCUMENT_TEXT_ADJUSTMENT_MODEL`.

Alternative considered: reuse `TEXT_GENERATION_MODEL` everywhere and set it to `gpt-5.4`. Rejected because editor adjustments are frequent, shorter, and do not need the expensive full-document model.

### Decision: Keep one provider contract and shared credentials

Resolve both model-specific providers through the existing text-generation provider abstraction, using the same provider key, API key, base URL, timeout, and error normalization. Only the model differs by purpose.

Alternative considered: create a second provider contract for editor adjustments. Rejected because the current contract already supports the prompt/response shape needed by text adjustment.

### Decision: Inject the adjustment provider into the adjustment service

The document-generation pipeline should continue receiving the primary generation provider. The document text-adjustment endpoint/service should receive the adjustment-specific provider so its metadata and cost reflect `gpt-4.1-mini`.

Alternative considered: pass a model override into `generateText` on each call. Rejected because it blurs runtime wiring with business logic and makes tests less explicit.

## Risks / Trade-offs

- [Risk] A misconfigured adjustment model could silently fall back to the expensive generation model. -> Mitigation: define an explicit default and add tests proving adjustment uses `gpt-4.1-mini`.
- [Risk] Two provider instances duplicate some setup. -> Mitigation: reuse the same resolver and shared configuration, changing only the model parameter.
- [Risk] Existing tests assume a single provider instance. -> Mitigation: update fixtures to inject both generation and adjustment providers where needed.
- [Risk] Production `.env` already has `TEXT_GENERATION_MODEL=gpt-5.4`; example/default config may drift. -> Mitigation: document both model settings in `.env.example` and env parsing tests.

## Migration Plan

1. Add the adjustment model runtime config with default `gpt-4.1-mini`.
2. Set the generation model default/example to `gpt-5.4` for production OpenAI use.
3. Wire the document text-adjustment service to the adjustment provider.
4. Verify run metadata records `gpt-5.4` for document generation and `gpt-4.1-mini` for adjustment calls.
5. Deploy with the existing OpenAI API key; rollback by setting both model env vars to the same previous model if needed.
