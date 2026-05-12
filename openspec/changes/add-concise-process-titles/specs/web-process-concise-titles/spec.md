## ADDED Requirements

### Requirement: Process creation UI MUST provide a reviewed concise title
The web process creation flow MUST expose a `Título` field for the concise process title. The field MUST be populated with a deterministic suggestion during manual entry or PDF import, MUST remain editable, and MUST be submitted with the reviewed create-process payload.

#### Scenario: Manual object entry suggests a concise title
- **WHEN** an actor enters a long process object and has not manually edited the title field
- **THEN** the creation page suggests a concise title derived from the object
- **AND** the full object remains unchanged in the object field

#### Scenario: Manual title edits are preserved
- **WHEN** an actor edits the title field manually
- **THEN** subsequent object changes or PDF import application do not overwrite that manually edited title unless the actor changes it again

#### Scenario: Imported PDF preview includes a concise title
- **WHEN** an actor imports a readable TopDown SD PDF
- **THEN** the import preview shows the suggested concise title alongside the extracted process fields
- **AND** applying the import fills the title field without shortening the object field

#### Scenario: Reviewed process submission includes title
- **WHEN** an actor submits a valid manually entered or PDF-prefilled process form
- **THEN** the app sends the reviewed concise title in the process creation request

### Requirement: Process list and detail UI MUST display concise process titles
The web process listing and process detail page MUST use the concise process `title` as the primary display name. The UI MUST preserve access to the full `object` text and MUST fall back gracefully when an API response does not yet include a title.

#### Scenario: Process list row uses title
- **WHEN** the process listing receives a process with both `title` and `object`
- **THEN** the row primary text displays `title` instead of the full object

#### Scenario: Process detail heading uses title
- **WHEN** the process detail page receives a process with both `title` and `object`
- **THEN** the page heading displays `title` instead of the full object
- **AND** the full object remains available in the process detail content

#### Scenario: Older API response falls back to object-derived display
- **WHEN** the web UI receives a process response with a missing or blank `title`
- **THEN** the UI derives a concise display title from `object` rather than rendering an empty heading
