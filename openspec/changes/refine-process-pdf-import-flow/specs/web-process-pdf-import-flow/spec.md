## ADDED Requirements

### Requirement: Process creation exposes PDF import as a secondary action
The process creation page MUST keep the manual process form as the primary surface and MUST expose TopDown SD import as a subtle secondary action.

#### Scenario: Manual form is the primary first viewport
- **WHEN** the user opens `/app/processo/novo`
- **THEN** the process data form is visible without a persistent PDF import card above it
- **AND** a secondary import action labelled for TopDown SD import is available near the page or form actions

#### Scenario: Import action opens a dialog
- **WHEN** the user activates the TopDown SD import action
- **THEN** the system opens a dialog for selecting and reviewing the PDF import
- **AND** the underlying form remains visible behind the dialog without changing values

### Requirement: Import dialog previews extracted data before applying
The import dialog MUST parse the selected PDF into a reviewable preview and MUST NOT overwrite form fields until the user explicitly applies the extracted data.

#### Scenario: Closing dialog leaves form unchanged
- **WHEN** the user opens the import dialog and closes it without applying extracted data
- **THEN** every process form field keeps the value it had before the dialog was opened

#### Scenario: Readable PDF shows preview
- **WHEN** the user selects a readable TopDown Solicitação de Despesa PDF
- **THEN** the dialog displays a preview of the extracted process fields before applying them to the form
- **AND** the dialog enables an explicit action to apply the extracted data

#### Scenario: Applying preview fills the form
- **WHEN** the user applies a successful PDF preview
- **THEN** the dialog closes
- **AND** the process form fields are filled with the extracted values
- **AND** the page shows a compact indication that data was imported from the selected PDF

#### Scenario: Replacing an imported PDF requires confirmation through preview
- **WHEN** the form already contains imported values and the user selects another PDF in the dialog
- **THEN** the system shows a new preview for the newly selected PDF
- **AND** the existing form values are not replaced until the user applies the new preview

### Requirement: Frontend extraction matches backend-observable TopDown SD parsing
The frontend PDF import MUST extract the same essential Solicitação de Despesa fields that the existing backend parser can extract from equivalent machine-readable TopDown PDF text.

#### Scenario: Real TopDown SD fixture is imported successfully
- **WHEN** the user selects a representative TopDown Solicitação de Despesa PDF matching the readable structure of `/Users/vine/Downloads/SD.pdf`
- **THEN** the frontend extracts request number `6`
- **AND** the frontend derives source reference `SD-6-2026`
- **AND** the frontend extracts issue date `2026-01-08`
- **AND** the frontend extracts organization CNPJ `08.290.223/0001-42`
- **AND** the frontend extracts budget unit code `06.001`
- **AND** the frontend extracts budget unit name `Sec.Mun.de Educ,Cultura, Esporte e Lazer`
- **AND** the frontend extracts process type `Serviço`
- **AND** the frontend extracts the classification/object, justification, responsible name, and responsible role from the same sections recognized by the backend parser

#### Scenario: Backend-readable text is not reported as unreadable PDF
- **WHEN** a TopDown PDF produces machine-readable text with the same markers used by the backend parser
- **THEN** the frontend MUST NOT show the generic PDF-read failure message
- **AND** any failure after text extraction is reported as a parsing, required-field, or matching problem

#### Scenario: Extracted values are normalized for the form
- **WHEN** the frontend applies extracted SD data to the process form
- **THEN** date, process type, source reference, object, justification, requester, and responsible metadata are normalized to the values expected by the process creation payload

### Requirement: Import errors are diagnostic and actionable
The import flow MUST distinguish PDF reading failures, SD parsing failures, missing required fields, and organization or department matching warnings.

#### Scenario: File cannot be read as PDF
- **WHEN** the selected file is not a readable PDF or PDF text extraction fails before text is available
- **THEN** the dialog reports a PDF reading failure
- **AND** the form remains unchanged

#### Scenario: PDF text is not a TopDown SD
- **WHEN** the selected PDF is readable but does not contain the required Solicitação de Despesa markers or fields
- **THEN** the dialog reports that the file could not be recognized as a TopDown Solicitação de Despesa
- **AND** the form remains unchanged

#### Scenario: Organization or department cannot be matched
- **WHEN** the selected SD PDF is parsed successfully but the extracted CNPJ or budget unit cannot be matched to available organizations or departments
- **THEN** the dialog reports the unmatched entity as an actionable warning or field-level issue
- **AND** the PDF is not described as unreadable

#### Scenario: User can recover from failed import
- **WHEN** an import attempt fails
- **THEN** the user can select another PDF in the same dialog or close the dialog and continue filling the form manually
