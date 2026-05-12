## ADDED Requirements

### Requirement: Document recipes MUST use reviewed SD item lists proportionally
Document-generation recipes for DFD, ETP, TR, and Minuta MUST instruct generation to consider the full reviewed SD item list when it is available, while keeping each document type within its expected level of detail. The recipes MUST NOT direct the provider to collapse the procurement object to the first item when a reviewed item list exists.

#### Scenario: DFD recipe receives reviewed SD items
- **WHEN** the backend assembles a DFD generation request with reviewed SD item rows
- **THEN** the recipe guidance tells the provider to use the item list to understand the demand as a whole
- **AND** the recipe keeps the DFD administrative, introductory, and proportional rather than requiring exhaustive item-by-item specification

#### Scenario: ETP recipe receives reviewed SD items
- **WHEN** the backend assembles an ETP generation request with reviewed SD item rows
- **THEN** the recipe guidance tells the provider to use the item list when analyzing need, feasibility, alternatives, and consistency with the contracting object
- **AND** the recipe forbids inventing items or categories that are not supported by the reviewed list or process context

#### Scenario: TR recipe receives reviewed SD items
- **WHEN** the backend assembles a TR generation request with reviewed SD item rows
- **THEN** the recipe guidance allows the provider to use the item list for object, specification, delivery, receiving, and obligation sections where relevant
- **AND** the recipe keeps the item evidence tied to the reviewed rows rather than a singular representative item

#### Scenario: Minuta recipe receives reviewed SD items
- **WHEN** the backend assembles a Minuta generation request with reviewed SD item rows
- **THEN** the recipe guidance tells the provider to use the item list for contractual object and execution clauses
- **AND** the recipe avoids copying TR-level technical detail into the contract unless the process context requires it
