## ADDED Requirements

### Requirement: Process creation form MUST provide an editable SD items section
The web process creation form MUST include an `Itens da SD` section where the actor can review and maintain item rows associated with the process before submission. Each item row MUST support code, description, quantity, unit, unit value, and total value fields.

#### Scenario: Actor adds a manual item row
- **WHEN** the actor clicks the control to add an SD item on the process creation page
- **THEN** the form adds an editable item row
- **AND** the actor can fill code, description, quantity, unit, unit value, and total value

#### Scenario: Actor edits an existing item row
- **WHEN** the actor changes any editable field in an SD item row
- **THEN** the form state reflects the revised item value
- **AND** the revised value is used for submission instead of any previously extracted value

#### Scenario: Actor removes an item row
- **WHEN** the actor removes an SD item row from the process creation page
- **THEN** the row is no longer displayed
- **AND** the removed row is not included in submitted source metadata

#### Scenario: Process can be created without item rows
- **WHEN** the actor fills the required process fields but leaves the SD items section empty
- **THEN** the form allows process creation to continue without fabricating item evidence

### Requirement: PDF import MUST extract and preview multiple SD item rows
The browser-side TopDown SD PDF import MUST attempt to extract a simple top-level item list from readable item-table text and MUST show the extracted rows in the import dialog before applying them to the form.

#### Scenario: Multi-item SD preview shows all detected rows
- **WHEN** the actor selects a readable TopDown SD PDF whose item table contains multiple rows
- **THEN** the import dialog previews every detected top-level item row
- **AND** each preview row shows available code, description, quantity, unit, unit value, and total value

#### Scenario: Wrapped description lines are attached to the following numeric row
- **WHEN** the PDF text contains item descriptions split across multiple lines followed by a row like `0005910 550 0,00 0,00 KIT`
- **THEN** the parser creates one item using the accumulated description text
- **AND** it assigns `0005910` as code, `550` as quantity, `0,00` as unit value, `0,00` as total value, and `KIT` as unit

#### Scenario: Import cancel leaves current item rows unchanged
- **WHEN** the actor previews PDF-extracted items and closes or cancels the import dialog without applying
- **THEN** the current process form item rows remain unchanged

#### Scenario: Applying a new PDF replaces imported item evidence
- **WHEN** the actor applies a second PDF import before creating the process
- **THEN** the form replaces the previous imported item rows with the newly applied rows
- **AND** manual edits made after the previous import are not carried into the new imported item set unless the actor re-enters them

### Requirement: Process creation submission MUST serialize reviewed SD items
The web process creation request builder MUST serialize the reviewed item rows into the existing process `sourceMetadata` payload and MUST preserve compatibility with singular item consumers.

#### Scenario: Reviewed items are submitted in source metadata
- **WHEN** the actor submits the process creation form with one or more reviewed SD item rows
- **THEN** the request payload includes those rows at `sourceMetadata.extractedFields.items`
- **AND** each submitted row includes only metadata fields needed by the process, excluding UI-only identifiers

#### Scenario: First reviewed item is preserved as compatibility item
- **WHEN** the actor submits reviewed SD item rows
- **THEN** the request payload also includes the first reviewed row at `sourceMetadata.extractedFields.item`
- **AND** existing process creation consumers that read the singular item can continue to operate

#### Scenario: Manual item rows create minimal metadata
- **WHEN** the actor manually adds item rows without applying a PDF import
- **THEN** the request payload includes `sourceMetadata.extractedFields.items`
- **AND** the metadata identifies the item source as manual entry without changing unrelated process identity fields

#### Scenario: Empty item list does not overwrite imported metadata with fabricated items
- **WHEN** the actor submits the form with no reviewed SD item rows
- **THEN** the request payload does not fabricate `sourceMetadata.extractedFields.items`
