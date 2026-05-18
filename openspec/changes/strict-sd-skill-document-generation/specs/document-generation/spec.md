## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. For SD-backed processes, the system MUST also apply the runtime `sd-document-intelligence` contract before invoking the provider, producing factual extraction, enriched context, document plan, writer input, reviewer input, and final rewrite context from the skill-aligned pipeline. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department and source metadata when available, the process data, the organization data, the submitted instructions, and the skill-aligned context package before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, the submitted instructions, and the skill-aligned context package before invoking the provider

#### Scenario: SD-backed generation uses the skill contract
- **WHEN** an authorized actor requests DFD, ETP, TR, or Minuta generation for a process created from Solicitação de Despesa data
- **THEN** the system applies the runtime `sd-document-intelligence` contract to classify, enrich, plan, write, review, and rewrite the document

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: SD-backed generation MUST fail closed when the skill contract is unavailable
The system MUST NOT silently fall back to a generic document-generation flow for SD-backed DFD, ETP, TR, or Minuta generation when the runtime SD intelligence contract cannot be loaded, parsed, or validated.

#### Scenario: Runtime skill contract cannot be loaded
- **WHEN** an authorized actor requests an SD-backed document and the runtime skill contract is unavailable
- **THEN** the system marks the generation attempt as failed with an internal generation error instead of invoking the provider with a generic prompt

### Requirement: Debug metadata MUST expose skill-aligned stages only when requested
The system MUST keep normal generation responses free of internal skill and pipeline details. When debug mode is requested, the system MUST expose the skill contract identity and the major stage outputs needed to diagnose generation quality.

#### Scenario: Normal response hides skill internals
- **WHEN** an authorized actor requests document generation without debug mode
- **THEN** the response does not include skill contract text, enriched context package, internal review JSON, or rewrite diagnostics

#### Scenario: Debug response includes skill stage trace
- **WHEN** an authorized actor requests document generation with debug mode
- **THEN** the response metadata includes skill contract version, source digest, extracted facts, enriched context, classification, document plan, writer style, first draft, humanization result, review result, rewrite attempts, and final draft

### Requirement: SD-backed generation MUST preserve skill-quality acceptance cases
The system MUST produce role-correct, skill-aligned outputs for representative SD profiles that previously performed better through the Codex skill.

#### Scenario: Social kit distribution generates institutional/social treatment
- **WHEN** an SD requests materials or kits for free distribution in a commemorative municipal action
- **THEN** the generated document treats the procurement as a point-in-time social or institutional acquisition with controls for item coverage, delivery, receiving, and distribution traceability where supported by the SD

#### Scenario: Artistic presentation keeps cultural and date-sensitive risks
- **WHEN** an SD requests artistic or cultural presentation for a municipal event
- **THEN** the generated document treats the procurement as cultural or event-related, with proportional attention to schedule sensitivity, execution evidence, receiving, and acceptance

#### Scenario: Simple acquisition remains concise
- **WHEN** an SD describes a simple acquisition with low complexity
- **THEN** the generated document remains proportional and does not become artificially long or analytically excessive
