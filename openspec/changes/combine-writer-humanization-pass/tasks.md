## 1. Discovery

- [x] 1.1 Inspect current writer prompt assembly, humanization prompt assembly, pipeline stage metadata, and related tests.
- [x] 1.2 Confirm the backend config/env pattern to use for an experimental generation pipeline flag.

## 2. Configuration

- [x] 2.1 Add a backend configuration flag for the combined writer/humanization path, defaulting to the existing split path.
- [x] 2.2 Include the new flag in tests or config parsing coverage so invalid values fail consistently with existing env handling.

## 3. Prompt Assembly

- [x] 3.1 Extract reusable final-style guidance from the current humanization pass without changing the existing split path.
- [x] 3.2 Build a combined final-writer prompt that includes document context, plan, writer style, recipe constraints, and final-style guidance.
- [x] 3.3 Add prompt-focused tests asserting the combined prompt asks for a final institutional document and avoids draft/pipeline metalinguagem.

## 4. Pipeline Execution

- [x] 4.1 Update SD-backed pipeline execution to choose between split `writer` + `humanization` and combined final-writer based on config.
- [x] 4.2 Record the combined provider call with a distinct stable stage name in pipeline call metadata.
- [x] 4.3 Preserve local review, rewrite cycles, structured-output projection, validation, persistence, and fallback behavior after the combined draft.
- [x] 4.4 Ensure progress callbacks remain compatible with the combined path.

## 5. Tests and Measurement

- [x] 5.1 Add focused pipeline tests for the disabled flag path, proving existing `writer` + `humanization` behavior remains intact.
- [x] 5.2 Add focused pipeline tests for the enabled flag path, proving only one initial provider call is made before review/structured output.
- [x] 5.3 Add metadata aggregation tests for combined stage cost/tokens and separate `structured_output` cost/tokens.
- [x] 5.4 Generate or simulate a representative DFD through the combined path and compare call count, token usage, cost metadata, review status, and structured-output status against the current baseline.

## 6. Validation

- [x] 6.1 Run focused API tests for document generation pipeline, prompt assembly, structured output, and env/config parsing.
- [x] 6.2 Run `openspec validate combine-writer-humanization-pass --strict` or the repository's equivalent OpenSpec validation command.
- [x] 6.3 Document the observed cost/quality result from the first combined-path DFD test so the team can decide whether to keep, tune, or disable the experiment.
