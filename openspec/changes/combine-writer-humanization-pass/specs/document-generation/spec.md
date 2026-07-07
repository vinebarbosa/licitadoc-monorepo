## ADDED Requirements

### Requirement: SD-backed generation MUST support a combined final-writer path
The system MUST support a configurable SD-backed generation path that produces the reviewed draft candidate with a single provider call combining the current writer and humanization responsibilities. When this path is enabled, the system MUST still build the request from the same stored procurement context, document plan, recipe guidance, and writer style inputs used by the existing pipeline.

#### Scenario: Combined final-writer path is enabled
- **WHEN** an authorized actor requests an SD-backed generated document and the combined final-writer path is enabled
- **THEN** the generation pipeline invokes one provider call for the initial final draft candidate instead of separate `writer` and `humanization` calls

#### Scenario: Combined final-writer path is disabled
- **WHEN** an authorized actor requests an SD-backed generated document and the combined final-writer path is disabled
- **THEN** the generation pipeline keeps using the existing separate `writer` and `humanization` calls

### Requirement: Combined final-writer generation MUST preserve quality gates
The combined final-writer path MUST preserve the existing local review loop after the first draft candidate. If review rejects the combined draft, the system MUST continue to use the existing rewrite behavior before finalizing generation.

#### Scenario: Combined draft passes local review
- **WHEN** the combined final-writer output satisfies the local document review
- **THEN** the pipeline proceeds without a rewrite call

#### Scenario: Combined draft fails local review
- **WHEN** the combined final-writer output does not satisfy the local document review
- **THEN** the pipeline performs the configured rewrite cycle before completing or failing generation

### Requirement: Combined final-writer metadata MUST remain comparable
The system MUST record pipeline metadata that distinguishes the combined final-writer path from the split writer/humanization path. Metadata MUST preserve enough provider call, token, cost, review, rewrite, and structured-output information to compare generation quality and cost between both paths.

#### Scenario: Combined generation records call stages
- **WHEN** a generated document completes through the combined final-writer path
- **THEN** generation metadata identifies the combined provider call with a distinct stage name and does not report a separate `humanization` call for that run

#### Scenario: Structured output remains separately measured
- **WHEN** structured output is enabled for a generated document using the combined final-writer path
- **THEN** generation metadata records the structured-output provider call separately from the combined final-writer call
