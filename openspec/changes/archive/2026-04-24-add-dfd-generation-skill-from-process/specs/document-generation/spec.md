## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored process data, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department and source metadata when available, the process data, the organization data, and the submitted instructions before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the process data, the process organization data, the repository-managed DFD recipe, resolved department and source metadata when available, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: DFD generation MUST persist only DFD-structured draft content
The system MUST constrain generated `dfd` drafts to the canonical DFD structure and MUST NOT persist sections that belong to other procurement document families from the same reference source. The stored draft content for `dfd` MUST remain limited to the DFD structure even when the reference material used to build the recipe originally coexisted with `ETP` or `TR` content.

#### Scenario: Generated DFD omits ETP and TR sections
- **WHEN** the provider returns content for a valid `dfd` generation request
- **THEN** the stored draft content follows the canonical DFD structure and does not include `ETP` or `TR` headings or body sections
