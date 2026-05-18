## ADDED Requirements

### Requirement: Process creation MUST expose SD import as a secondary action
The process creation page MUST keep manual creation as the primary workflow and MUST expose Solicitação de Despesa import as an optional secondary action.

#### Scenario: Import action is available on the create page
- **WHEN** an authorized user opens `/app/processo/novo`
- **THEN** the manual process form is visible
- **AND** an action to import a Solicitação de Despesa is available without replacing the form

#### Scenario: Import action opens a dialog
- **WHEN** the user activates the SD import action
- **THEN** the system opens a focused dialog for selecting a PDF
- **AND** the current form values remain unchanged while the dialog is open

### Requirement: SD import dialog MUST preview extraction before applying
The import dialog MUST read the selected PDF, parse it as a TopDown Solicitação de Despesa, and show a reviewable preview before any form field is changed.

#### Scenario: Closing dialog does not change form values
- **WHEN** the user opens the import dialog and closes it without applying an extraction
- **THEN** every process form field keeps the value it had before the dialog opened

#### Scenario: Readable SD PDF shows preview
- **WHEN** the user selects a readable TopDown Solicitação de Despesa PDF
- **THEN** the dialog displays extracted process fields, item fields, source reference, and relevant warnings
- **AND** the dialog enables an explicit action to apply the extracted data

#### Scenario: Selecting another PDF replaces only the dialog preview
- **WHEN** the dialog already has a parsed preview and the user selects another PDF
- **THEN** the dialog refreshes the preview for the newly selected PDF
- **AND** the underlying process form remains unchanged until the user applies the new preview

### Requirement: Applying SD import MUST populate editable process form values
When the user applies a successful SD extraction, the system MUST map extracted values into the current process creation wizard while keeping the resulting fields editable.

#### Scenario: Applying extraction fills process data
- **WHEN** the user applies a successful SD extraction containing request number, issue date, object, justification, responsible name, and item rows
- **THEN** the form is populated with the derived process number, external id, issue date, title, object, justification, responsible name, and process items
- **AND** all populated fields remain editable before submission

#### Scenario: Applying extraction resolves department by budget unit
- **WHEN** the extracted SD contains a budget unit code that matches one available department in the effective organization
- **THEN** the form selects that department as a linked unit

#### Scenario: Organization-scoped user keeps forced organization
- **WHEN** a non-admin user applies an SD extraction
- **THEN** the form keeps the actor organization selected
- **AND** department matching is limited to that organization

#### Scenario: Admin extraction may select matching organization
- **WHEN** an admin applies an SD extraction whose CNPJ matches exactly one loaded organization
- **THEN** the form selects that organization before matching departments inside it

#### Scenario: Import summary is shown after applying
- **WHEN** the user applies an SD extraction
- **THEN** the page shows a compact indication that data was imported from the selected SD
- **AND** the indication includes the file name or source reference when available

### Requirement: SD import MUST report diagnostic failures without blocking manual creation
The import flow MUST distinguish file-reading failures, unrecognized SD content, missing required SD fields, and unmatched organization or department hints. Failed imports MUST leave the manual form usable.

#### Scenario: File cannot be read as PDF
- **WHEN** the selected file is empty, non-PDF, protected, image-only, or cannot yield machine-readable text
- **THEN** the dialog reports a PDF reading failure
- **AND** the process form remains unchanged

#### Scenario: PDF text is not a recognized SD
- **WHEN** the selected PDF is readable but does not contain the expected TopDown Solicitação de Despesa markers
- **THEN** the dialog reports that the file was not recognized as a TopDown SD
- **AND** the process form remains unchanged

#### Scenario: Required SD fields are missing
- **WHEN** the selected PDF is recognized as an SD but lacks required fields for a useful preview
- **THEN** the dialog reports missing required fields
- **AND** the process form remains unchanged

#### Scenario: Organization or department cannot be matched
- **WHEN** extraction succeeds but the CNPJ or budget unit does not match loaded references
- **THEN** the dialog or applied summary reports an actionable warning
- **AND** the user can continue by selecting organization or departments manually

#### Scenario: User can recover after failure
- **WHEN** an import attempt fails
- **THEN** the user can select another PDF in the same dialog or close the dialog and keep filling the form manually

### Requirement: SD-imported process submission MUST use the reviewed manual payload
After SD data is applied, process creation MUST submit the reviewed wizard values through the existing manual process creation endpoint.

#### Scenario: Submit after applying SD import
- **WHEN** the user applies SD data, edits any desired fields, completes required links, and submits the process
- **THEN** the system sends the reviewed form values to `POST /api/processes/`
- **AND** the submitted payload reflects the current editable form state rather than reparsing the PDF

#### Scenario: Manual creation remains unchanged
- **WHEN** the user does not import an SD
- **THEN** the process creation page still supports the existing manual creation flow
- **AND** validation and navigation behavior remain unchanged
