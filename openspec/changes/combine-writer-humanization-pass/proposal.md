## Why

The current structured generation test path produces good DFD output, but it pays for separate `writer` and `humanization` model calls before the final structured-output projection. The latest measured DFD shows the humanization pass accounts for a meaningful share of total cost, so we should test whether a single final-writer call can preserve quality while reducing latency and spend.

## What Changes

- Combine the current writer and humanization responsibilities into one provider call for SD-backed document generation.
- Keep the existing local review loop after the combined draft so quality gates can still trigger a `rewrite` when needed.
- Keep structured output as a separate final projection call for this experiment, so the test isolates the writer/humanization merge from direct JSON generation.
- Preserve generation metadata that makes the new path measurable against the current pipeline, including call stages, token usage, cost, review status, and structured-output status.
- Do not change public document APIs or remove legacy document read fallbacks.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation`: SD-backed generation should support a combined final-writer path that replaces the separate `writer` and `humanization` calls while preserving review, rewrite, and structured-output behavior.

## Impact

- Affected backend modules: `apps/api/src/modules/documents/document-generation-pipeline.ts`, pipeline schemas/metadata tests, and document generation tests.
- Affected recipe/prompt assets: base writer instructions and/or humanization guidance may need to be folded into the writer prompt.
- Affected observability: generation-run metadata should identify the combined stage clearly enough to compare cost and quality against the previous `writer` + `humanization` path.
- No expected database migration or public API change.
