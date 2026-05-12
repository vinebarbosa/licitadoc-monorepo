## ADDED Requirements

### Requirement: Document prompts MUST include hierarchical SD item evidence when available
The system MUST provide document-generation prompts with a bounded, prompt-facing item evidence representation when structured SD items are available. The evidence MUST preserve top-level line items and their component relationship instead of exposing only flattened semantic groups.

#### Scenario: Prompt receives all structured line items
- **WHEN** document generation is prepared for an SD-backed process with three structured top-level item rows and nested components
- **THEN** the prompt includes evidence for all three top-level item rows and their associated component labels

#### Scenario: Prompt preserves item-component hierarchy
- **WHEN** a top-level SD item contains nested components
- **THEN** the prompt shows those components under the corresponding top-level item instead of only as one global deduplicated component list

#### Scenario: Prompt evidence stays bounded
- **WHEN** a structured SD item contains long technical specifications and attributes
- **THEN** the prompt evidence includes concise labels and relevant component summaries without dumping full raw specification prose into every document type

### Requirement: Document prompts MUST avoid legacy first-item dominance when structured evidence exists
When structured item evidence is available, the system MUST NOT present the legacy representative `item.description` as the dominant item signal in the provider prompt. The legacy item MAY remain in metadata for compatibility, but prompt assembly MUST prefer the hierarchical item evidence block.

#### Scenario: Structured evidence suppresses legacy representative description
- **WHEN** a process has structured `items[]` and a legacy `item.description` containing a long first item
- **THEN** the prompt uses the structured item evidence and does not include the long first-item description as a standalone dominant field

#### Scenario: Legacy description remains fallback
- **WHEN** a process does not have reliable structured item evidence
- **THEN** the prompt may use the legacy representative item description as fallback evidence and MUST expose diagnostics indicating fallback use

### Requirement: Item evidence diagnostics MUST identify where evidence degraded
The system MUST expose compact diagnostics alongside prompt item evidence so operators and tests can distinguish extraction issues from semantic summary, recipe, or provider behavior.

#### Scenario: Contaminated item evidence is reported
- **WHEN** item evidence contains page/header fragments or missing row values
- **THEN** the prompt context includes diagnostics indicating contaminated or incomplete item evidence

#### Scenario: Clean item evidence is reported
- **WHEN** item evidence contains clean top-level rows with row values and components
- **THEN** the prompt context marks structured item evidence as available and does not report fallback use
