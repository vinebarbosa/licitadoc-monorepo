## ADDED Requirements

### Requirement: Support action MUST open a dedicated support flow
The floating help widget SHALL treat "Falar com suporte" as a dedicated support flow instead of only adding a local assistant guidance response.

#### Scenario: User selects support quick action
- **WHEN** an authenticated user opens the help widget and selects "Falar com suporte"
- **THEN** the widget displays a support-focused state inside the same floating panel
- **AND** the state does not require leaving the current app page

#### Scenario: User returns to assistant
- **WHEN** the user is viewing support intake or support chat
- **THEN** the widget provides a visible control to return to the assistant experience
- **AND** activating that control restores the assistant conversation surface in the same widget

### Requirement: Support intake MUST capture the user's issue with helpful user actions
The support flow SHALL show a compact intake state that captures the user's issue and offers user-facing actions, such as attaching a screenshot, before opening a support conversation.

#### Scenario: User opens support intake
- **WHEN** the support flow is opened from the widget
- **THEN** the widget shows support availability or estimated response copy
- **AND** the widget provides a user-facing action to attach a screenshot or similar evidence
- **AND** the widget provides an input for the user to describe the issue
- **AND** the widget does not expose raw route metadata as the main intake content

#### Scenario: User submits an empty issue
- **WHEN** the support intake issue field is empty or only whitespace
- **THEN** the widget does not start the support chat
- **AND** the user remains able to type the issue

#### Scenario: User attaches a screenshot
- **WHEN** the user activates the screenshot action in support intake
- **THEN** the widget marks the screenshot as attached
- **AND** the support chat shows a visual preview of the attached screenshot when the chat starts

#### Scenario: User submits an issue
- **WHEN** the user enters a support issue and submits the intake
- **THEN** the widget starts a support chat state
- **AND** the submitted issue appears as part of the conversation history

### Requirement: Support chat MUST provide a trustworthy conversation surface
The support chat state SHALL show a protocol-like identifier, support identity or availability, message history, input controls, and local sending feedback.

#### Scenario: Support chat starts
- **WHEN** the user submits the support intake
- **THEN** the widget displays a support chat conversation
- **AND** the conversation includes a support status or identity
- **AND** the conversation includes a protocol-like reference for the support request

#### Scenario: User sends a support chat message
- **WHEN** the user types a message in support chat and submits it
- **THEN** the widget appends the user's message to the local conversation
- **AND** the widget shows local sending or response feedback
- **AND** the widget adds a deterministic support reply without requiring a backend request

#### Scenario: User submits an empty support chat message
- **WHEN** the support chat message field is empty or only whitespace
- **THEN** the widget does not append a new message
- **AND** the user remains in the support chat state

### Requirement: Support flow MUST remain frontend-local until a backend contract exists
The support flow SHALL use local deterministic state for intake, protocol display, messages, typing affordances, and support replies in the initial implementation.

#### Scenario: Support flow runs without support API
- **WHEN** the user opens and uses the support flow
- **THEN** the widget completes the support intake and chat interactions without making a new support API request
- **AND** the user receives clear local feedback that the interaction was captured in the widget

#### Scenario: User closes and reopens the widget
- **WHEN** the user closes the widget and opens it again during the same page session
- **THEN** the widget presents a usable help state
- **AND** the system does not require persisted support conversation data

### Requirement: Support UI MUST be accessible and responsive inside the widget
The support intake and support chat states SHALL preserve readable text, keyboard-operable controls, assistive labels, and non-overlapping layout across supported widget sizes.

#### Scenario: Keyboard user uses support flow
- **WHEN** a keyboard user navigates through support intake or support chat
- **THEN** actionable controls are reachable by keyboard
- **AND** icon-only controls expose accessible labels
- **AND** focus states are visible

#### Scenario: User opens support on a constrained viewport
- **WHEN** the widget is open on a small or constrained viewport
- **THEN** the support intake and support chat controls remain readable and reachable
- **AND** the layout does not require horizontal scrolling
