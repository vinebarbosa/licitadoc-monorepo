## ADDED Requirements

### Requirement: Document generation metadata MUST aggregate strict pipeline provider calls
When the strict document generation pipeline is used, the system MUST persist every successful text-generation call made by the pipeline under `responseMetadata.pipeline.calls`. Each call entry MUST include `stage`, `model`, `providerKey`, `responseId`, `usage`, and `costUsd`. The `stage` value MUST be one of `writer`, `humanization`, or `rewrite`.

#### Scenario: Pipeline performs writer, humanization, and rewrite calls
- **WHEN** a document generation run completes after a writer call, a humanization call, and one or more rewrite calls
- **THEN** `responseMetadata.pipeline.calls` contains one entry per successful provider call in execution order with the correct stage names

#### Scenario: Pipeline skips a provider stage
- **WHEN** humanization is skipped because no successful humanization provider result is available
- **THEN** `responseMetadata.pipeline.calls` contains only the successful provider calls that actually occurred

### Requirement: Document generation metadata MUST store aggregate pipeline usage and cost
When `responseMetadata.pipeline.calls` is present, the system MUST also persist aggregate fields derived from those calls: `totalInputTokens`, `totalCachedInputTokens`, `totalOutputTokens`, `totalTokens`, `totalCostUsd`, and `callCount`. Token totals MUST sum normalized usage fields across all calls. `totalCostUsd` MUST equal the sum of call costs when all calls have known costs and MUST be `null` when any included call has unknown cost.

#### Scenario: Aggregates sum writer, humanization, and rewrite usage
- **WHEN** the pipeline completes with writer, humanization, and two rewrite calls that each include usage and cost
- **THEN** the aggregate token totals, call count, and total cost match the sum of all four call entries

#### Scenario: Provider usage is unavailable
- **WHEN** one or more pipeline calls come from a provider result without usage metadata
- **THEN** the aggregate token totals remain numeric and predictable, and the call entries preserve nullable cost metadata without failing the document run

### Requirement: Pipeline metadata compatibility MUST be preserved
Adding call accounting MUST NOT remove existing final-call metadata or existing pipeline summary/debug metadata.

#### Scenario: Existing final-call metadata remains available
- **WHEN** the pipeline returns a final provider result with `responseId` and `status`
- **THEN** those fields remain available at the same top-level `responseMetadata` paths as before

#### Scenario: Existing pipeline debug remains available
- **WHEN** pipeline debug metadata is requested for a document generation run
- **THEN** `responseMetadata.pipeline.debug` and the existing summary fields remain available alongside the new call and aggregate metadata
