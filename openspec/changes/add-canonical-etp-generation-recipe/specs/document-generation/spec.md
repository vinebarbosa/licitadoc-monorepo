## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department and source metadata when available, the process data, the organization data, and the submitted instructions before invoking the provider. For `etp`, the system MUST assemble the generation input from the repository-managed ETP instruction asset, the repository-managed ETP Markdown template, resolved department and source metadata when available, normalized estimate availability, the process data, the organization data, and the submitted instructions before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, and the submitted instructions before invoking the provider

#### Scenario: Generation uses canonical ETP recipe and safe estimate context
- **WHEN** an authorized actor requests an ETP draft for a stored process whose source context has no estimate or only `R$ 0,00`
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed ETP recipe, resolved department and source metadata when available, submitted instructions, and an explicit indication that the estimate is unavailable

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: ETP generation MUST preserve canonical structure and absent-estimate safety
The system MUST constrain generated `etp` drafts to the canonical ETP structure and MUST NOT persist sections that belong to other procurement document families from the same reference source. The stored draft content for `etp` MUST include the `ESTIMATIVA DO VALOR DA CONTRATACAO` section, MUST treat absent values and `R$ 0,00` as unavailable estimates, and MUST NOT persist fictitious monetary values or simulated market research.

#### Scenario: Generated ETP omits DFD and TR sections
- **WHEN** the provider returns content for a valid `etp` generation request
- **THEN** the stored draft content follows the canonical ETP structure and does not include `DFD` or `TR` headings or body sections

#### Scenario: Missing estimate remains explicit in generated ETP
- **WHEN** the provider generates an `etp` draft for a process whose source context has no estimate or only `R$ 0,00`
- **THEN** the stored draft keeps the value-estimate section and states that the estimate is unavailable, not informed, not present in the context, or will be subject to later apuracao

#### Scenario: Zero value is not treated as a valid price
- **WHEN** the source context for an `etp` generation request contains `R$ 0,00`, `0`, `0,00`, or `0.00` as the only monetary value
- **THEN** the generation prompt and stored draft do not present that zero value as the contracting price or as a valid market estimate
