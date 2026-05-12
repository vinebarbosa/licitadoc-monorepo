## ADDED Requirements

### Requirement: Live document preview MUST auto-follow newly visible generated text
The document preview page MUST keep the viewport aligned with the newest visible generated document text while a generating document is being rendered with live document content. Auto-follow MUST apply to the generated document body, not to planning-only progress.

#### Scenario: Live document sheet starts rendering
- **WHEN** a generating document receives enough generated text to render the document sheet
- **THEN** the page follows the live document writing area
- **AND** the newest visible generated text remains in view as the typewriter preview grows

#### Scenario: More visible text is typed
- **WHEN** the typewriter preview appends more visible generated text
- **THEN** the page scrolls to keep the live writing endpoint in view
- **AND** the document text continues to render progressively instead of jumping only after completion

### Requirement: Auto-follow MUST preserve user scroll control
The document preview page MUST pause automatic following when the user scrolls away from the newest live generated content and MUST resume following when the user returns near the live writing endpoint.

#### Scenario: User scrolls away from live writing
- **WHEN** live generated text is visible
- **AND** the user scrolls away from the newest generated content
- **THEN** automatic following pauses
- **AND** additional typed content does not force the viewport away from the user's chosen position

#### Scenario: User returns near the newest content
- **WHEN** automatic following is paused
- **AND** the user scrolls back near the newest generated content
- **THEN** automatic following resumes for subsequent visible text growth

### Requirement: Auto-follow motion MUST remain accessible and scoped
Auto-follow MUST respect reduced-motion preferences and MUST remain scoped to generating live previews only.

#### Scenario: Reduced motion is preferred
- **WHEN** the user agent reports reduced-motion preference
- **THEN** auto-follow avoids smooth animated scrolling
- **AND** the newest generated text remains reachable and visible while generation continues

#### Scenario: Generation completes
- **WHEN** the realtime stream emits completion and the authoritative completed document detail is rendered
- **THEN** auto-follow stops
- **AND** the completed persisted document preview does not keep scrolling automatically
