## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department and source metadata when available, the process data, the organization data, and the submitted instructions before invoking the provider. The generation context MUST match the post-`elevate-minuta-contractual-quality` checkpoint and MUST NOT require post-checkpoint `objectSemanticSummary`, structured `objectItemEvidence`, semantic primary groups, dominant-item rationale, or `sourceMetadata.extractedFields.items` arrays as drafting authorities.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

#### Scenario: Generation context excludes post-checkpoint semantic layers
- **WHEN** the backend assembles a generation prompt for `dfd`, `etp`, `tr`, or `minuta`
- **THEN** the prompt context does not include post-checkpoint semantic-summary authority fields such as `objectSemanticSummary`, `primaryGroups`, `summaryLabel`, `objectItemEvidence`, dominant-item rationale, or structured SD item-array evidence

#### Scenario: Minuta context preserves checkpoint contractual safeguards
- **WHEN** the backend assembles a `minuta` generation prompt
- **THEN** the prompt preserves the checkpoint Minuta safeguards for fixed clause stability, contractual role separation, type-aware contextualization, conservative placeholders, and anti-hallucination behavior
