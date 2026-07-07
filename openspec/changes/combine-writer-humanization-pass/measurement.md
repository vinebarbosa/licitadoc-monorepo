## Combined Path Measurement

Date: 2026-05-25

## Simulated DFD Pipeline Test

The focused unit test `executeDocumentGenerationPipeline uses combined final writer before structured output` exercises a representative DFD with the combined path enabled and structured output enabled.

Observed simulated behavior:

- Provider calls: 2
- Stages: `final_writer`, `structured_output`
- Local review: `approved`
- Rewrite count: 0
- Structured output: validated and persisted from the separate `structured_output` call
- Progress callbacks: preserved on the combined `final_writer` call
- Metadata aggregation: cost, input tokens, cached input tokens, output tokens, total tokens, response IDs, and per-stage calls are preserved

The test uses stubbed usage/cost values, so it verifies accounting shape and pipeline behavior rather than real provider pricing.

## Expected Real-Cost Effect

The latest measured real DFD before this change used `openai` / `gpt-4.1-mini` with structured output enabled:

- Total: US$ 0.0101488
- `writer`: US$ 0.0043556
- `humanization`: US$ 0.0037196
- `structured_output`: US$ 0.0020736

If the combined final-writer call keeps roughly the same cost as the old writer call, the expected total for a similar DFD is approximately:

- `final_writer`: about US$ 0.0044, plus any prompt-growth variance
- `structured_output`: about US$ 0.0021
- Estimated total: about US$ 0.0065 to US$ 0.0070

That would be roughly 31% to 36% cheaper than the last measured structured DFD. A live OpenAI generation is still needed to judge text quality and confirm the real token/cost delta.
