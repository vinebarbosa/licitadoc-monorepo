## ADDED Requirements

### Requirement: Print and PDF export are distinct actions
The document preview toolbar MUST provide distinct behavior for printing and PDF export.

#### Scenario: Print opens browser print flow
- **WHEN** a user clicks "Imprimir" on a completed document preview
- **THEN** the system opens the browser print flow
- **AND** the system does not start the direct PDF download flow

#### Scenario: PDF export does not call print
- **WHEN** a user clicks "Exportar PDF" on a completed document preview
- **THEN** the system generates a PDF file for download
- **AND** the system does not call the browser print flow

### Requirement: PDF export downloads the rendered paged document
The document preview page MUST export a PDF file from the completed paged preview shown to the user.

#### Scenario: Export completed paged preview
- **WHEN** a completed document preview has rendered paged output
- **AND** the user clicks "Exportar PDF"
- **THEN** the system downloads a `.pdf` file named from the document
- **AND** the PDF contains the rendered document pages in page order

#### Scenario: Export includes letterhead when available
- **WHEN** a completed document preview is rendered with an organization letterhead
- **AND** the user exports the PDF
- **THEN** the exported PDF includes the letterhead as part of each exported page

### Requirement: PDF export availability follows preview readiness
The PDF export action MUST only be available when the preview has completed document content that can be exported.

#### Scenario: Document still generating
- **WHEN** a document is still generating
- **THEN** the "Exportar PDF" action is disabled

#### Scenario: Completed document without exportable pages
- **WHEN** a completed document has no rendered paged preview pages
- **THEN** clicking or attempting PDF export does not call print
- **AND** the user receives a controlled failure message

### Requirement: PDF export communicates progress and failure
The PDF export action MUST communicate its busy and failure states without disrupting the preview page.

#### Scenario: Export in progress
- **WHEN** PDF export is running
- **THEN** the PDF export action shows a pending state
- **AND** repeated clicks cannot start overlapping exports

#### Scenario: Export fails
- **WHEN** PDF generation fails
- **THEN** the preview remains visible
- **AND** the user sees a concise error message explaining that the PDF could not be exported
