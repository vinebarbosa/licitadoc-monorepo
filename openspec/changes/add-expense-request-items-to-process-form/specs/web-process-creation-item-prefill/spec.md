## ADDED Requirements

### Requirement: Process creation PDF import MUST extract a structured SD item list
The process creation PDF import MUST derive a structured list of SD items from readable TopDown PDFs. The extraction result MUST expose the complete list as `extractedFields.items` and MUST keep the existing singular `extractedFields.item` as a compatibility fallback.

#### Scenario: Multi-item SD yields multiple structured items
- **WHEN** the actor imports a readable TopDown SD PDF containing multiple top-level item rows
- **THEN** the extraction result includes every detected top-level row in `extractedFields.items`
- **AND** each item preserves available code, description or label, quantity, unit, unit value, and total value
- **AND** the singular `extractedFields.item` remains populated for compatibility

#### Scenario: Composite SD item yields component evidence
- **WHEN** an imported SD item represents a kit, set, bundle, or other composite item with component lines
- **THEN** the extraction result keeps those component lines attached to the corresponding top-level item
- **AND** each component preserves its label, quantity when available, attributes when available, and raw evidence text when available

#### Scenario: Structured item extraction is partial
- **WHEN** the import can read process fields but cannot confidently build the complete structured item list
- **THEN** the extraction result keeps the best available legacy item evidence
- **AND** it records a warning or diagnostic that the structured item evidence is partial or unavailable

### Requirement: Process creation page MUST preview extracted SD items before applying import data
The process creation page MUST show the actor the extracted item evidence inside the import dialog before those values are applied to the form.

#### Scenario: Import preview shows all extracted items
- **WHEN** a readable SD PDF is selected and item extraction succeeds
- **THEN** the import dialog shows an item preview with the item count and the extracted rows
- **AND** the preview does not collapse a multi-item SD into the first item only

#### Scenario: Import preview shows item warnings
- **WHEN** item extraction returns partial or fallback diagnostics
- **THEN** the import dialog shows a visible warning that item evidence should be reviewed
- **AND** the actor can still apply the other extracted process fields when required fields are available

#### Scenario: Canceling import leaves the current form unchanged
- **WHEN** the actor previews an imported SD and closes or cancels the dialog without applying it
- **THEN** the process form keeps its existing field values and item evidence unchanged

### Requirement: Process creation form MUST display applied SD items
After the actor applies an SD import, the process creation form MUST include a visible `Itens da SD` section populated from the applied extraction.

#### Scenario: Applied import creates an item section
- **WHEN** the actor applies an SD import containing structured items
- **THEN** the form displays an `Itens da SD` section with the applied items
- **AND** each row exposes the available item description or label, code, quantity, unit, and value information

#### Scenario: Applied import includes composite items
- **WHEN** an applied item contains components
- **THEN** the form indicates that the item has components
- **AND** the actor can inspect the component labels without leaving the process creation page

#### Scenario: Replacing an imported PDF refreshes item evidence
- **WHEN** the actor applies a second imported SD before creating the process
- **THEN** the form replaces the previous applied item evidence with the item evidence from the new import

#### Scenario: Manual process creation has no imported item section
- **WHEN** the actor creates or edits the form without applying an SD import
- **THEN** the page does not require item evidence to submit the process

### Requirement: Process creation submission MUST preserve applied SD items in source metadata
When a process is created from an applied SD import, the submitted payload MUST preserve the applied structured item evidence in the existing process source metadata.

#### Scenario: Imported process payload contains structured items
- **WHEN** the actor applies an SD import with structured items and submits the process creation form
- **THEN** the request body includes `sourceKind` as `expense_request`
- **AND** it includes the applied item list at `sourceMetadata.extractedFields.items`
- **AND** it preserves extraction warnings or diagnostics needed to assess item completeness

#### Scenario: Imported process payload remains compatible with singular item consumers
- **WHEN** the submitted source metadata contains `extractedFields.items`
- **THEN** it also preserves the legacy singular `sourceMetadata.extractedFields.item` when available

#### Scenario: Manual process payload does not fabricate item evidence
- **WHEN** the actor submits a manually created process without applying an SD import
- **THEN** the request body does not fabricate `sourceMetadata.extractedFields.items`
