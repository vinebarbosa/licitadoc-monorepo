## ADDED Requirements

### Requirement: Upload controls must support compact dropzones
The web frontend SHALL render supported file upload controls as compact dropzones that allow both click-to-select and drag-and-drop without exposing browser-native file input UI.

#### Scenario: User opens SD import dialog before choosing a PDF
- **WHEN** a user opens the "Importar SD" dialog
- **THEN** the visible upload control MUST communicate that the user can drag the SD PDF into the control or select it from the computer
- **AND** the control MUST remain compact enough to fit the dialog without pushing the extraction preview out of view on common desktop viewports

#### Scenario: User views letterhead onboarding before choosing an image
- **WHEN** a user views the "Papel timbrado" section during onboarding
- **THEN** the visible upload control MUST communicate that the user can drag the image into the control or select it from the computer
- **AND** the control MUST read as one polished upload area, not as a separate card plus button row

### Requirement: Dropzones must expose clear drag states
The web frontend SHALL show a localized, restrained visual state while a file is dragged over supported upload controls.

#### Scenario: User drags a file over the SD upload control
- **WHEN** a user drags a file over the SD upload dropzone
- **THEN** the dropzone MUST show an active state using existing `primary`, `ring`, `border`, and `muted` or `accent` tokens
- **AND** the active state MUST NOT introduce oversized animation, gradients, or decorative imagery

#### Scenario: User drops a file on the upload control
- **WHEN** a user drops a file on the upload dropzone
- **THEN** the same validation and processing flow used by the hidden file input MUST run
- **AND** the selected-file, loading, success, warning, and error states MUST remain in PT-BR

### Requirement: Dropzones must preserve accessibility and testability
The web frontend SHALL keep compact dropzones operable through keyboard, screen reader labels, and automated tests.

#### Scenario: Test selects a file by accessible label
- **WHEN** a test queries "Arquivo PDF da SD" or "Papel timbrado da organização"
- **THEN** it MUST still resolve to the underlying file input and allow file selection

#### Scenario: User activates the dropzone without drag-and-drop
- **WHEN** a user clicks or keyboard-activates the visible upload control
- **THEN** the native file picker MUST open through the associated hidden file input
