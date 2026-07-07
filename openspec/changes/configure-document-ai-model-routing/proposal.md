## Why

Document generation and editor-assisted text adjustment have different cost/quality profiles. Recent comparisons show `gpt-5.4` gives the best full-document DFD quality, while editor adjustments should favor lower cost and latency with `gpt-4.1-mini`.

## What Changes

- Configure full procurement document generation to use `gpt-5.4`.
- Configure AI-assisted document editing/text adjustment to use `gpt-4.1-mini`.
- Keep both flows on the existing provider abstraction and OpenAI credentials.
- Preserve generation run metadata so each execution records the actual model used.
- Avoid changing public document APIs, editor UX, or stored document schemas unless needed for model metadata.

## Capabilities

### New Capabilities

- `document-ai-model-routing`: Defines the purpose-specific model policy for full document generation versus editor text adjustment.

### Modified Capabilities

- `generation-provider`: Runtime text-generation configuration must support purpose-specific model selection while preserving the shared provider contract.

## Impact

- Backend environment/config parsing in `apps/api/src/plugins/env.ts` and `.env.example`.
- Text-generation provider wiring in `apps/api/src/plugins/text-generation.ts` or nearby provider resolution code.
- Full document generation pipeline in `apps/api/src/modules/documents/document-generation-pipeline.ts`.
- Document editor text adjustment service in `apps/api/src/modules/documents/document-text-adjustment.ts`.
- API tests for provider/model selection, document generation metadata, and editor adjustment provider usage.
