## ADDED Requirements

### Requirement: Recipes MUST use structured item evidence proportionally
Document-generation recipes MUST instruct the AI to treat structured item evidence as factual source context and use it proportionally to the document type. Recipes MUST NOT ask the AI to reinterpret the SD item table independently when structured item evidence is available.

#### Scenario: DFD recipe uses evidence without exhaustive item prose
- **WHEN** the prompt includes structured item evidence for a multi-item SD-backed process
- **THEN** the DFD recipe guides the model to write a cohesive administrative object from the complete item set without listing every component or technical specification

#### Scenario: ETP and TR recipes use evidence for technical coherence
- **WHEN** the prompt includes structured item evidence with top-level items and components
- **THEN** ETP and TR recipes guide the model to use that evidence for technical and operational coherence without treating the first item as representative of the whole object

#### Scenario: Minuta recipe uses evidence for contractual scope
- **WHEN** the prompt includes structured item evidence for a composite acquisition
- **THEN** the Minuta recipe guides the model to preserve the full contractual scope without converting the clause into an exhaustive item specification

### Requirement: Recipes MUST avoid first-item hyperfocus language
Recipes MUST prevent the model from treating a legacy representative item, first table row, or first component as the dominant object when structured item evidence exists.

#### Scenario: Structured evidence overrides legacy first item
- **WHEN** structured item evidence exists and a legacy first-item field is absent or marked as fallback
- **THEN** recipes instruct the model to base object wording on the structured item evidence and semantic summary rather than a first item

#### Scenario: Missing evidence is handled conservatively
- **WHEN** item evidence diagnostics indicate partial extraction or fallback use
- **THEN** recipes instruct the model to write conservatively and avoid inventing missing item groups or pretending all item evidence is complete
