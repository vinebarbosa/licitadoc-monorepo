## ADDED Requirements

### Requirement: Web design system upload pattern must include dropzone behavior
The web design system SHALL support a shared compact dropzone behavior for upload controls while preserving the existing hidden native file input accessibility model.

#### Scenario: Product module adopts the shared upload control
- **WHEN** a product module renders the shared upload control as a dropzone
- **THEN** it MUST receive consistent empty, dragging, selected, disabled, and error states from the shared pattern
- **AND** it MUST be able to customize context-specific copy without forking the component markup

#### Scenario: Dropzone is rendered in the Licitadoc palette
- **WHEN** the shared dropzone renders in light or dark theme
- **THEN** it MUST use design tokens for background, foreground, muted text, borders, focus rings, primary highlights, and destructive errors
- **AND** it MUST avoid hard-coded one-off colors that conflict with the authenticated application style
