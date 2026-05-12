## ADDED Requirements

### Requirement: Recipes MUST preserve lexical fidelity for multi-item objects
The repository-managed recipes for `dfd`, `etp`, `tr`, and `minuta` MUST instruct the model to preserve lexical and semantic fidelity to the item groups effectively present in the context when using multi-item object consolidation.

#### Scenario: DFD uses concrete groups in the object description
- **WHEN** DFD generation context indicates a `multi_item` object with concrete item groups
- **THEN** the DFD recipe instructs the model to describe the object as a consolidated set using those groups
- **AND** it avoids replacing the set with broad categories not present in the SD

#### Scenario: ETP analyzes the composite solution without generic category substitution
- **WHEN** ETP generation context indicates a `multi_item` object with concrete item groups
- **THEN** the ETP recipe instructs the model to analyze the solution as a set of those source-grounded groups
- **AND** it avoids treating contextual purpose labels as if they were item categories

#### Scenario: TR operationalizes concrete item groups
- **WHEN** TR generation context indicates a `multi_item` object with concrete item groups
- **THEN** the TR recipe instructs the model to structure delivery, conformity, receipt, correction, and fiscalization around those groups
- **AND** it avoids generic operational labels such as "insumos operacionais", "componentes logísticos", or "materiais de apoio a eventos" without source support

#### Scenario: Minuta formalizes concrete composite object scope
- **WHEN** Minuta generation context indicates a `multi_item` object with concrete item groups
- **THEN** the Minuta recipe instructs the model to formalize the object contractually while preserving those groups
- **AND** it avoids narrowing to one item or broadening to unsupported category-mother labels

#### Scenario: Recipes do not over-abstract unitary or unsupported objects
- **WHEN** the generation context is unitary or lacks reliable concrete multi-item groups
- **THEN** the recipes preserve the specific object
- **AND** they do not replace it with "materiais diversos", "itens de apoio", "componentes auxiliares", or similar broad terms without source support

### Requirement: Multi-item fidelity tests MUST reject unsupported generic categories
Document generation recipe tests MUST protect against over-abstraction by asserting that concrete source item groups remain visible and unsupported generic categories are absent.

#### Scenario: Potes kits embalagens fitas case remains concrete
- **WHEN** tests build prompts or context for an SD containing potes, kits, embalagens, fitas, and materiais auxiliares
- **THEN** the consolidated object includes concrete groups such as recipientes, kits, embalagens, fitas, or materiais auxiliares
- **AND** it does not include "materiais de apoio a eventos" unless that phrase is present in the source context

#### Scenario: Generic categories require source support
- **WHEN** tests build prompts for source context that mentions event, distribution, festivity, or administrative action only as purpose
- **THEN** the prompt does not introduce generic material categories from that purpose alone
- **AND** it preserves the concrete item-group vocabulary
