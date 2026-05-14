## MODIFIED Requirements

### Requirement: Document generation MUST assemble the draft from stored procurement context
The system MUST build each generation request from stored organization data, stored canonical process data, structured process items and kit components when available, resolved responsible display data when available, the requested document type, any optional operator instructions submitted with the request, and any repository-managed recipe required by that document type. The public API MUST NOT require callers to submit a raw provider prompt. For `dfd`, the system MUST assemble the generation input from the repository-managed DFD instruction asset, the repository-managed DFD Markdown template, resolved department data, canonical process fields, structured items and kit component evidence, item-derived estimate context when available, responsible display data, organization data, and the submitted instructions before invoking the provider. Legacy source metadata MAY be used as a fallback when canonical item or source-derived values are absent, but it MUST NOT override canonical process fields or structured process items.

#### Scenario: Generation uses canonical DFD recipe and process context
- **WHEN** an authorized actor requests a DFD draft for a stored process and includes operator instructions
- **THEN** the system assembles the generation input from the canonical process data, structured process items, the process organization data, the repository-managed DFD recipe, resolved department data, responsible display data when available, and the submitted instructions before invoking the provider

#### Scenario: Canonical item totals provide estimate context
- **WHEN** an authorized actor requests an ETP or Minuta draft for a stored process that has structured process items with total values
- **THEN** the generation input uses the canonical item totals as the primary estimate or price context
- **AND** source metadata estimate fields are used only when no canonical item total context is available

#### Scenario: Kit components are included in prompt context
- **WHEN** an authorized actor requests a TR or Minuta draft for a stored process that has a kit item with components
- **THEN** the generation input includes the kit identity and each component's title, description, quantity, and unit when available
- **AND** the provider context does not collapse the kit into a single description-only item

#### Scenario: Canonical items use neutral item wording
- **WHEN** an authorized actor requests generation for a process whose item evidence comes from structured process items
- **THEN** the generation input labels that evidence as process item context rather than SD-reviewed item context
- **AND** SD-specific wording is reserved for legacy or imported source metadata fallback evidence

#### Scenario: Responsible display data prefers canonical user data
- **WHEN** an authorized actor requests generation for a process that has responsible-user display data available
- **THEN** the generation input uses that responsible display data before falling back to stored responsible text, source metadata, or department responsible data

#### Scenario: Request targets a process outside actor visibility
- **WHEN** an authenticated `organization_owner` or `member` requests generation for a process whose organization differs from the actor's organization
- **THEN** the system rejects the request
