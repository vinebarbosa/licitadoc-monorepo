## ADDED Requirements

### Requirement: Upload controls must not expose native browser copy
The web frontend SHALL render file upload controls with Licitadoc-owned visible UI copy instead of exposing browser-native file input text such as "Choose File" or "No file chosen".

#### Scenario: SD import dialog is opened before a PDF is selected
- **WHEN** a user opens the "Importar SD" dialog
- **THEN** the visible upload control MUST present a PT-BR action for selecting the SD PDF
- **AND** the visible upload control MUST NOT show browser-native English file input copy

#### Scenario: Letterhead onboarding section is opened before an image is selected
- **WHEN** a user views the "Papel timbrado" onboarding section
- **THEN** the visible upload control MUST present a PT-BR action for selecting the organization letterhead image
- **AND** the visible upload control MUST NOT show browser-native English file input copy

### Requirement: Upload controls must show clear selected-file state
The web frontend SHALL show the selected file using localized file metadata and available actions after a user chooses a file.

#### Scenario: User selects an SD PDF
- **WHEN** a user selects a PDF in the "Importar SD" dialog
- **THEN** the dialog MUST show the selected file name in the custom upload UI
- **AND** the dialog MUST continue showing reading, success, warning, and error states in PT-BR

#### Scenario: User selects a letterhead image
- **WHEN** a user selects a valid letterhead image during onboarding
- **THEN** the onboarding section MUST show the file name, localized file size, and a PT-BR remove action
- **AND** removing the file MUST return the control to the localized empty state

### Requirement: Upload controls must remain accessible
The web frontend SHALL keep file selection operable by keyboard, screen reader, and automated tests even when the native input is visually hidden.

#### Scenario: User activates the upload control by keyboard
- **WHEN** focus is placed on the visible upload trigger and the user activates it by keyboard
- **THEN** the browser file picker MUST be opened through the associated file input
- **AND** focus styling MUST use the existing `ring` and `primary` design tokens

#### Scenario: Automated tests select a file by accessible label
- **WHEN** a test queries the SD or letterhead upload by its PT-BR accessible label
- **THEN** the test MUST be able to set the selected file on the underlying file input
