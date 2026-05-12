## ADDED Requirements

### Requirement: Document generation recipes MUST respect consolidated multi-item object guidance
The repository-managed recipes for `dfd`, `etp`, `tr`, and `minuta` MUST instruct the model to use consolidated object guidance when the generation context identifies a multi-item or composite acquisition. The recipes MUST prevent reduction of the object to a single dominant item while preserving unitary-object specificity and anti-hallucination protections.

#### Scenario: DFD represents composite acquisition scope
- **WHEN** a DFD prompt includes `multi_item` consolidated object guidance
- **THEN** the DFD recipe instructs the model to represent the administrative need as a consolidated acquisition
- **AND** it mentions the main item groups in aggregated and proportional form when present
- **AND** it avoids focusing the object only on the first or most dominant item

#### Scenario: ETP analyzes the solution as a set
- **WHEN** an ETP prompt includes `multi_item` consolidated object guidance
- **THEN** the ETP recipe instructs the model to analyze the acquisition as a composite set of related materials, kits, accessories, inputs, or support items
- **AND** it avoids treating only one product as the whole solution
- **AND** it preserves the global administrative purpose of the purchase

#### Scenario: TR structures execution for all item groups
- **WHEN** a TR prompt includes `multi_item` consolidated object guidance
- **THEN** the TR recipe instructs the model to structure delivery, receipt, conformity checks, correction, and fiscalization for the item groups as a set
- **AND** it avoids technical specifications that are disproportionately focused on one dominant item

#### Scenario: Minuta formalizes consolidated object contractually
- **WHEN** a Minuta prompt includes `multi_item` consolidated object guidance
- **THEN** the Minuta recipe instructs the model to formalize the object as a composite acquisition in contractual language
- **AND** it preserves the breadth of the contracting scope without adding items or obligations not present in context

#### Scenario: Recipes preserve unitary object behavior
- **WHEN** a generation prompt is unitary or lacks reliable multi-item consolidation signals
- **THEN** the recipes keep the object specific and direct
- **AND** they do not replace the object with a vague category such as "materiais diversos" without source support

#### Scenario: Recipes prohibit invented categories
- **WHEN** the source context lacks an item group, accessory, kit, material category, or administrative purpose
- **THEN** the recipes prohibit inventing that group or purpose in the consolidated object
- **AND** they require a balance between semantic synthesis and fidelity to the original request

### Requirement: Multi-item recipe tests MUST cover representative acquisition families
The document generation recipe tests MUST cover composite object behavior for material escolar, kits, brindes, informática with accessories, limpeza, saúde, events/support materials, and materiais diversos, and MUST cover unitary objects that should remain specific.

#### Scenario: Representative composite prompts are protected by tests
- **WHEN** tests build DFD, ETP, TR, or Minuta prompts for representative multi-item acquisitions
- **THEN** each prompt exposes consolidated object guidance
- **AND** the prompt or recipe text includes instructions not to summarize the object by only the first item
- **AND** the prompt keeps source-grounded item groups visible for the generated document

#### Scenario: Unitary prompts are protected by tests
- **WHEN** tests build prompts for unitary objects such as software, artistic presentation, vehicle, consulting service, or a specific work
- **THEN** the prompt does not claim a composite acquisition
- **AND** the recipe guidance does not force unnecessary aggregation
