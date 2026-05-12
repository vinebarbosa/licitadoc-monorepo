## ADDED Requirements

### Requirement: Document creation process picker MUST display concise process titles
The document creation UI MUST use the concise process title as the primary process label in the process picker. The UI MUST keep the process number visible, MUST NOT render the full process object as the primary label when a concise title is available, and MUST fall back to a derived display label when the title is missing or blank.

#### Scenario: Picker option uses concise title
- **WHEN** the document creation page receives a process with `processNumber`, `title`, and `object`
- **THEN** the process picker option displays the process number and the concise `title`
- **AND** the full `object` is not rendered as the primary picker label

#### Scenario: URL-preselected process uses concise title in the trigger
- **WHEN** the document creation page is opened with a valid `processo` query parameter and the matching process has a concise `title`
- **THEN** the selected picker trigger displays the process number and the concise `title`
- **AND** the trigger does not expand to the full process object

#### Scenario: Missing title falls back gracefully
- **WHEN** a process picker item has a missing or blank `title`
- **THEN** the document creation UI displays a fallback label derived from the process `object` or `processNumber`
- **AND** the picker remains selectable

#### Scenario: Document name suggestion remains based on process number
- **WHEN** an actor selects a document type and a process whose picker label uses a concise title
- **THEN** the generated document name still follows the existing `<TYPE> - <processNumber>` format
