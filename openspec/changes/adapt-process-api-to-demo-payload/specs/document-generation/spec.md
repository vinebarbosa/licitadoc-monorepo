## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored canonical process data, structured process items, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department data, canonical process fields, structured items when available, responsible-user data when available, organization data, and the submitted instructions before invoking the provider.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the canonical process data, structured process items, the process organization data, the repository-managed DFD recipe, resolved department data, and the submitted instructions before invoking the provider

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request
