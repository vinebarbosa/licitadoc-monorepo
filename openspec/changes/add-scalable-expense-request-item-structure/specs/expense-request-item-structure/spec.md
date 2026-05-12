## ADDED Requirements

### Requirement: SD item structure MUST represent line items, components, and attributes separately
The system MUST provide a structured representation of Solicitação de Despesa item evidence that separates top-level line items, nested components, and descriptive attributes. The representation MUST be generic and based on SD structure rather than hardcoded procurement object types.

#### Scenario: Multiple kit line items are preserved
- **WHEN** an SD contains multiple top-level kit rows for different education stages or beneficiary groups
- **THEN** the item structure includes each kit row as a distinct top-level item
- **AND** each row preserves available code, quantity, unit, unit value, total value, and label
- **AND** the system does not collapse the item table into only the first kit description

#### Scenario: Components are nested below their parent item
- **WHEN** an SD row contains numbered or clearly separated component labels inside a kit, lot, bundle, group, or set
- **THEN** the item structure records those labels as components of the parent item
- **AND** it preserves component labels such as caderno, lápis, borracha, apontador, cola, tinta, tesoura, squeeze, or analogous labels without requiring those exact categories to be preconfigured

#### Scenario: Descriptive attributes are not promoted to item groups
- **WHEN** item text contains specification phrases such as packaging instructions, manufacturer name, certification, material composition, dimensions, validity, or weight
- **THEN** the item structure records those phrases as attributes or supporting details
- **AND** it does not promote those phrases into top-level item groups unless the SD explicitly presents them as item or component labels

### Requirement: SD item structure MUST expose extraction quality diagnostics
The system MUST expose internal extraction quality diagnostics for downstream semantic use and tests. Diagnostics MUST indicate whether structured item evidence was found, how many top-level items/components were detected, and whether fallback parsing was used.

#### Scenario: Structured evidence is available
- **WHEN** an SD item table yields multiple line items or components
- **THEN** diagnostics indicate structured evidence is available
- **AND** downstream semantic logic can prefer that evidence over a flattened description

#### Scenario: Parser falls back to legacy item text
- **WHEN** the SD text does not contain enough reliable structure to identify line items or components
- **THEN** diagnostics indicate fallback parsing
- **AND** the legacy representative `item` remains available without invented additional items

### Requirement: SD item structure MUST remain object-type scalable
The system MUST avoid object-specific patches for individual procurement objects when extracting item structure. It MUST use structural signals such as table headers, repeated row patterns, codes, quantities, units, values, line breaks, item numbering, and parent/component boundaries.

#### Scenario: Non-kit multi-item SD uses the same structure
- **WHEN** an SD contains non-kit multi-item acquisitions such as equipment with accessories, office supplies, cleaning supplies, health supplies, or service bundles
- **THEN** the parser uses the same item structure model
- **AND** it does not require a dedicated parser branch for that object category

