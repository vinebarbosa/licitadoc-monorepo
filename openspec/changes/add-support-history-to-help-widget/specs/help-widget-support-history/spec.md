## ADDED Requirements

### Requirement: Widget MUST provide access to support history
The floating help widget SHALL provide a user-facing way to view previously opened support requests from within the widget.

#### Scenario: User opens support history
- **WHEN** an authenticated user opens the help widget support experience
- **THEN** the widget provides an entry point for previous support requests
- **AND** activating the entry point opens support history inside the same floating panel
- **AND** the current app page remains visible behind the widget

#### Scenario: User returns from support history
- **WHEN** the user is viewing support history
- **THEN** the widget provides a visible control to return to the assistant or current support flow
- **AND** activating that control does not close the widget

### Requirement: Support history MUST show recognizable request summaries
The support history view SHALL list previous support requests using information that helps the requester recognize each conversation.

#### Scenario: History has previous requests
- **WHEN** previous support requests are available
- **THEN** the widget lists each request with a subject or first-message summary
- **AND** each request shows a protocol-like reference
- **AND** each request shows status, timestamp, and latest message preview

#### Scenario: Request includes screenshot attachment
- **WHEN** a previous support request includes a screenshot attachment
- **THEN** the history list shows a compact attachment indicator
- **AND** the indicator is understandable without exposing internal metadata

#### Scenario: History is empty
- **WHEN** no previous support requests are available
- **THEN** the widget shows an empty state that explains there are no previous requests
- **AND** the widget provides a visible action to start a new support request

### Requirement: User MUST be able to reopen a previous support conversation
The support history view SHALL let users open a previous support request and review its message history.

#### Scenario: User selects a previous support request
- **WHEN** the user selects an item from support history
- **THEN** the widget opens that support conversation inside the panel
- **AND** the conversation shows the protocol-like reference and support status
- **AND** the conversation shows previous user and support messages in chronological order

#### Scenario: Previous request is closed or resolved
- **WHEN** the opened previous support request is closed or resolved
- **THEN** the widget indicates that the conversation is not active
- **AND** the widget provides an action to start a new support request

#### Scenario: Previous request is active
- **WHEN** the opened previous support request is active
- **THEN** the widget may keep the support message composer available
- **AND** new messages are appended to the local conversation history without requiring a backend request in the initial implementation

### Requirement: Current session support requests MUST appear in history
The widget SHALL include support requests created during the current page session in support history.

#### Scenario: User starts a new support chat
- **WHEN** the user submits a new support intake
- **THEN** the widget creates a support history entry for that request
- **AND** the entry includes the submitted issue as the recognizable subject or preview

#### Scenario: User sends another message in an active support chat
- **WHEN** the user sends another support chat message
- **THEN** the corresponding support history entry updates its latest message preview
- **AND** the conversation remains available from support history during the page session

### Requirement: Initial support history MUST remain frontend-local
The initial implementation SHALL use local deterministic history data and current-session state until a support history backend contract exists.

#### Scenario: Support history loads without backend
- **WHEN** the widget renders support history
- **THEN** it displays seeded and current-session local history without making a support history API request
- **AND** interactions remain deterministic and testable in the frontend

#### Scenario: User closes and reopens widget during session
- **WHEN** the user closes and reopens the widget during the same page session
- **THEN** the widget presents a usable support history state
- **AND** the initial implementation does not require persisted conversation data across sessions

### Requirement: Support history UI MUST be accessible and compact
The support history UI SHALL remain readable, keyboard-operable, and compact inside the floating widget.

#### Scenario: Keyboard user navigates history
- **WHEN** a keyboard user tabs through support history
- **THEN** each history item and primary action is reachable by keyboard
- **AND** focus states are visible

#### Scenario: User opens history on constrained viewport
- **WHEN** the widget is open on a small or constrained viewport
- **THEN** the history list and conversation view remain readable
- **AND** the layout does not require horizontal scrolling
