## ADDED Requirements

### Requirement: Planning progress panel MUST render an animated vertical stepper
The document preview page MUST render planning progress as a compact vertical timeline/stepper with multiple product-facing generation stages. The stepper MUST replace the simple phase grid while continuing to avoid raw planning or reasoning text.

#### Scenario: Planning progress is available
- **WHEN** a user opens the preview page for a generating document
- **AND** the realtime stream emits planning progress
- **THEN** the page renders a vertical stepper inside the planning progress card
- **AND** the stepper includes more than three product-facing generation stages
- **AND** raw planning content is not shown as a transcript

#### Scenario: Active step advances
- **WHEN** planning progress or generated document progress advances
- **THEN** the stepper updates completed, active, and pending step states
- **AND** the active step is visually distinct from completed and pending steps

### Requirement: Planning stepper MUST auto-scroll within a bounded card
The planning progress card MUST keep the stepper in a bounded vertical viewport and automatically bring the active step into view as the active step changes.

#### Scenario: Active step moves beyond visible viewport
- **WHEN** the active generation step changes to a step outside the visible stepper viewport
- **THEN** the stepper scrolls vertically to bring the active step into view
- **AND** the overall document preview layout does not grow unbounded because of the step list

#### Scenario: Document content starts streaming
- **WHEN** generated document text begins rendering in the document sheet
- **THEN** the stepper remains outside the document sheet
- **AND** the active step can advance into document-writing or preview-formatting stages

### Requirement: Planning stepper motion MUST remain accessible
The planning stepper MUST remain understandable without animation and MUST respect reduced-motion preferences.

#### Scenario: Reduced motion is preferred
- **WHEN** the user agent reports reduced-motion preference
- **THEN** the stepper does not rely on pulse or smooth-scroll animation to communicate progress
- **AND** completed, active, and pending states remain visually distinguishable

#### Scenario: Generation completes
- **WHEN** the realtime stream emits completion for the current document
- **THEN** the page refetches the authoritative document detail
- **AND** the completed document preview renders without the transient planning stepper
