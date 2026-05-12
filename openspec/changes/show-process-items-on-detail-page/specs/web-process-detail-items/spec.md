## ADDED Requirements

### Requirement: Process detail page displays solicitation items below justification

The process detail page SHALL show solicitation item metadata immediately below the justification section when the process detail response contains usable item data.

#### Scenario: Multiple extracted items are available
- **WHEN** the process detail response contains two or more usable rows in `sourceMetadata.extractedFields.items`
- **THEN** the process detail page displays an item section below `Justificativa`
- **AND** the section lists each item with its description or title
- **AND** the section displays quantity and unit when available
- **AND** the section displays unit value and total value when available

#### Scenario: Item section order preserves process overview flow
- **WHEN** the process detail page displays object, justification, items, and process documents
- **THEN** the item section appears after `Justificativa`
- **AND** the process document cards remain below the process summary card

#### Scenario: No usable item metadata exists
- **WHEN** the process detail response has no usable `sourceMetadata.extractedFields.items` rows and no usable singular item fallback
- **THEN** the process detail page does not display misleading item rows
- **AND** the page remains usable with object, justification, and documents visible

### Requirement: Process detail item display handles variant item metadata

The process detail page SHALL normalize supported item metadata shapes before rendering so imported and future native solicitation items can be displayed consistently.

#### Scenario: Singular legacy item metadata is available
- **WHEN** `sourceMetadata.extractedFields.items` is absent or empty
- **AND** `sourceMetadata.extractedFields.item` contains usable item data
- **THEN** the process detail page displays that item in the item section as a single row

#### Scenario: Item contains component metadata
- **WHEN** an item contains usable component or subitem metadata
- **THEN** the item section displays the parent item
- **AND** the section displays the components beneath that item with component description or title
- **AND** the section displays component quantity and unit when available

#### Scenario: Item descriptions are long
- **WHEN** an item description is long enough to exceed the compact row layout
- **THEN** the item section keeps the layout readable without overlapping adjacent content
- **AND** the full description remains accessible in the page

#### Scenario: Item row has partial fields
- **WHEN** an item row has a usable description or title but lacks quantity, unit, unit value, or total value
- **THEN** the process detail page displays the available fields
- **AND** the missing fields do not render as incorrect values such as `undefined`, `null`, or `NaN`
