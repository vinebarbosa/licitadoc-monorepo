## ADDED Requirements

### Requirement: Automatic screen boundaries do not force printed pages

The system SHALL treat measurement-derived automatic document pagination boundaries as screen-only pagination hints for print/PDF output.

#### Scenario: Automatic boundary in print

- **WHEN** a document preview element has an automatic pagination boundary before it
- **THEN** print/PDF styling MUST reset the boundary spacer to zero
- **AND** print/PDF styling MUST NOT force a page break before that element

#### Scenario: Automatic boundary on screen

- **WHEN** the same document preview is rendered in screen media
- **THEN** the automatic boundary MUST continue to place the element at the next visual preview sheet boundary

### Requirement: Manual page breaks remain printed page breaks

The system SHALL preserve explicit manual document page breaks as physical page breaks in print/PDF output.

#### Scenario: Manual page break in print

- **WHEN** a document contains an explicit manual page-break boundary
- **THEN** print/PDF styling MUST start following content on a new printed page
- **AND** print/PDF styling MUST reset the visual spacer height for the page-break marker

### Requirement: Print flow avoids blank pages caused by automatic boundaries

The system SHALL allow normal document content to flow across automatic preview boundaries during print/PDF generation when the browser can fit the content on the current printed page.

#### Scenario: Following paragraph fits on current printed page

- **WHEN** a normal paragraph follows an automatic screen pagination boundary and there is remaining printable space on the current physical page
- **THEN** the paragraph MUST NOT be moved to the next printed page solely because of the automatic boundary

#### Scenario: Browser pagination requires a new physical page

- **WHEN** the browser's print layout cannot fit following content on the current physical page
- **THEN** the browser MAY place that content on the next printed page

### Requirement: Print verification covers automatic and manual boundaries

The system SHALL include regression coverage for print behavior that distinguishes automatic screen pagination from manual page breaks.

#### Scenario: CSS regression coverage

- **WHEN** tests inspect generated pagination boundary CSS
- **THEN** automatic boundaries MUST have no forced print page break
- **AND** manual boundaries MUST retain a forced print page break

#### Scenario: Browser PDF regression coverage

- **WHEN** the preview is exported or printed to PDF in browser verification
- **THEN** pages MUST NOT become mostly blank due solely to automatic screen pagination boundaries
- **AND** explicit manual page breaks MUST still be visible as printed page breaks
