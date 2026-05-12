## ADDED Requirements

### Requirement: Recipes MUST produce cohesive object prose from structured item evidence
The repository-managed DFD, ETP, TR, and Minuta recipes MUST instruct the model to use structured item evidence and semantic summaries to write cohesive object descriptions. Recipes MUST avoid forcing exhaustive item-by-item lists in high-level sections while still reflecting the breadth of the SD.

#### Scenario: DFD describes school kits cohesively
- **WHEN** DFD generation context includes structured evidence for multiple school-kit rows and their components
- **THEN** the DFD recipe guides the model to describe the object as acquisition of school kits or didactic-pedagogical materials for the relevant students/stages
- **AND** it may mention representative component families such as writing, correction, coloring, painting, modeling, cutting, notebooks, and complementary school-use items when supported by evidence
- **AND** it does not claim that technical details or composition remain undefined when they are present in the SD

#### Scenario: Recipes do not overpromote attributes
- **WHEN** structured evidence classifies a term as a descriptive attribute rather than a line item or component
- **THEN** recipes instruct the model not to use that term as a primary object category

### Requirement: Recipes MUST remain object-type scalable
Recipes MUST not encode a separate drafting rule for every possible procurement object. They MUST rely on structured item roles, semantic summary labels, component families, and evidence-quality flags.

#### Scenario: Same recipe behavior supports non-kit objects
- **WHEN** the structured item evidence represents non-kit multi-item acquisitions or bundled services
- **THEN** recipes use the same semantic fields and role distinctions to produce cohesive prose
- **AND** they do not require object-specific instructions for each category
