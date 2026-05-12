## Why

Ollama is streaming tokens in real time for the current local model, but the first tokens arrive in the vendor-specific `thinking` field while the normalized `response` field stays empty. The document preview therefore receives no visible chunks until thinking finishes, then gets the generated document quickly and only simulates realtime typing in the frontend.

## What Changes

- Configure the Ollama `/api/generate` request used for document generation to disable thinking output so visible `response` chunks begin as soon as the model starts producing the document.
- Keep `stream: true` enabled and preserve the existing normalized provider contract, final accumulated text behavior, metadata handling, and error normalization.
- Add tests that assert the Ollama request sends thinking disabled and that streamed `response` chunks still invoke incremental callbacks in order.
- Avoid frontend UI changes; the live preview should benefit from receiving real `response` chunks earlier.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `generation-provider`: Ollama-backed generation must disable provider thinking output for document generation so realtime chunks are emitted through the normalized `response` stream instead of being hidden in `thinking`.

## Impact

- `apps/api/src/shared/text-generation/ollama-provider.ts`
- `apps/api/src/shared/text-generation/text-generation.test.ts`
- No database migration, API client regeneration, or frontend UI change is expected.
