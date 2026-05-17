## ADDED Requirements

### Requirement: Page ruler guide
The public document editor demo SHALL display a horizontal page ruler aligned to the document sheet's usable text area.

#### Scenario: Ruler appears above the page
- **WHEN** a user opens `/demo/documento/editor`
- **THEN** the editor displays a ruler between the formatting toolbar and the document sheet

#### Scenario: Ruler aligns to document content
- **WHEN** the document sheet is visible at desktop width
- **THEN** the ruler's measurement area aligns with the sheet's editable text area rather than the full viewport

### Requirement: Margin and indentation markers
The ruler guide SHALL show subtle markers for page margins and paragraph/tab indentation so users can understand spacing relationships while editing.

#### Scenario: Marker visibility
- **WHEN** the ruler is visible
- **THEN** it shows margin regions, measurement ticks, and paragraph/tab guide markers in a non-disruptive style

#### Scenario: Theme consistency
- **WHEN** markers are rendered
- **THEN** they use the existing editor theme colors and avoid strong contrast that competes with document content

### Requirement: Tab behavior supports paragraph organization
The editor SHALL prevent accidental focus movement to the AI instruction input when a user presses Tab while working with selected document text.

#### Scenario: Tab does not focus AI input
- **WHEN** document text is selected and the user presses Tab
- **THEN** focus remains associated with the document editing surface instead of moving to the AI input

#### Scenario: List indentation remains available
- **WHEN** the cursor or selection is inside a list item and the user presses Tab or Shift+Tab
- **THEN** the editor applies list indentation or outdentation when TipTap can perform that action
