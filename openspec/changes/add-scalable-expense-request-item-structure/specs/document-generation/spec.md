## ADDED Requirements

### Requirement: Document generation MUST prefer structured item evidence for semantic summaries
Document generation MUST build object semantic context from structured SD item evidence when available. It MUST prefer parsed line items, components, and role classifications over a single flattened item description.

#### Scenario: Structured item evidence feeds semantic summary
- **WHEN** a process source metadata contains structured item evidence with top-level items and components
- **THEN** document prompt assembly uses that evidence to build the semantic object summary
- **AND** it does not derive the object primarily from the first legacy `item.description`

#### Scenario: Attributes do not become semantic groups
- **WHEN** structured item evidence classifies packaging, dimensions, certification, manufacturer, composition, or validity as attributes
- **THEN** document generation does not expose those attributes as primary material groups unless they are also actual item/component labels

### Requirement: Document generation MUST expose evidence-quality diagnostics for provider analysis
Document generation tests and prompt assembly MUST make it possible to distinguish extraction/semantic failures from provider/model failures. The system MUST treat provider replacement as a later diagnostic branch when structured evidence is already coherent.

#### Scenario: Bad output with bad evidence is not attributed to provider
- **WHEN** source metadata lacks structured item evidence or diagnostics indicate fallback parsing
- **THEN** the issue is classified as evidence extraction or semantic-summary risk before blaming the generation provider

#### Scenario: Bad output with good evidence can trigger provider review
- **WHEN** prompt context contains coherent structured item evidence and semantic summary fields but generated prose still misrepresents the object
- **THEN** the issue can be evaluated as prompt, recipe, or provider/model behavior
- **AND** tests may compare provider behavior without changing the item extraction contract

