## ADDED Requirements

### Requirement: Printed previews MUST suppress screen pagination spacers
The system MUST ensure that automatic pagination spacers used to align content with on-screen document sheets are not printed as physical height in browser print output.

#### Scenario: Automatic boundary prints without artificial spacer
- **WHEN** a completed TipTap preview contains an automatic pagination boundary before a block
- **THEN** the screen layout MAY use a transient spacer to align that block with the next visual sheet
- **AND** the print layout MUST reset that spacer's margin or height to zero before printing

#### Scenario: Manual boundary prints without visual gap height
- **WHEN** a completed TipTap preview contains a manual page-break boundary
- **THEN** the screen layout MAY use a transient visual gap to represent the page break
- **AND** the print layout MUST reset that visual gap height to zero before printing

### Requirement: Printed previews MUST preserve page breaks
The system MUST preserve automatic and manual pagination boundaries as browser print page-break hints when the user prints or saves a completed preview as PDF.

#### Scenario: Automatic boundary starts a printed page
- **WHEN** a completed TipTap preview is printed with an automatic pagination boundary
- **THEN** the boundary element MUST request a new printed page using browser-supported page-break CSS
- **AND** the following content MUST NOT be preceded by the screen-only spacer height

#### Scenario: Manual boundary starts a printed page
- **WHEN** a completed TipTap preview is printed with a persisted manual page break
- **THEN** the manual boundary MUST request a new printed page using browser-supported page-break CSS
- **AND** the manual screen gap MUST NOT print as an extra blank region

### Requirement: Print styles MUST override generated pagination CSS deterministically
The system MUST make generated pagination boundary CSS print-aware so dynamically injected screen rules cannot override print resets because of specificity or source order.

#### Scenario: Generated CSS separates screen and print behavior
- **WHEN** the pagination surface generates boundary CSS for automatic or manual boundaries
- **THEN** screen spacer rules MUST be scoped to screen rendering
- **AND** print reset rules MUST be emitted with the same generated boundary selectors or stronger deterministic selectors

### Requirement: Printed previews MUST exclude screen-only page chrome
The system MUST exclude screen-only pagination frames, shadows, workspace gaps, app controls, and artificial page-surface heights from printed document output.

#### Scenario: Long paginated preview prints only document content
- **WHEN** a user prints a long completed TipTap preview
- **THEN** visual page frames and app chrome MUST be hidden from print output
- **AND** pagination surface, content layer, and ProseMirror minimum heights MUST NOT create additional blank printed pages

### Requirement: Screen pagination MUST remain unchanged
The system MUST preserve the existing on-screen paginated preview and editor experience while changing print behavior.

#### Scenario: Preview remains visually paginated on screen
- **WHEN** a user opens a completed TipTap preview in the browser
- **THEN** the preview MUST continue showing visual document sheets, page gaps, shadows, and displaced overflowing blocks according to the measured pagination plan
- **AND** print-only resets MUST NOT affect normal screen rendering
