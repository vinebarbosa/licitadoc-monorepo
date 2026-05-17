## ADDED Requirements

### Requirement: Help widget creates persisted support tickets
The system SHALL allow an authenticated user to create a persisted support ticket from the contextual help widget.

#### Scenario: User submits a support issue from the widget
- **WHEN** an authenticated user submits a non-empty issue through the widget support intake
- **THEN** the API creates a support ticket using the authenticated user as requester
- **AND** the API creates the first user message in the same operation
- **AND** the widget shows the created ticket conversation using the API response

#### Scenario: Widget includes contextual metadata
- **WHEN** the widget creates a support ticket
- **THEN** the ticket stores the current help context screen, route, source, and optional entity label
- **AND** screenshot context is stored as attachment metadata when the user attached a screenshot indicator

#### Scenario: User cannot create an empty support ticket
- **WHEN** the user submits the support intake with an empty or whitespace-only issue
- **THEN** the widget prevents submission or the API rejects the request
- **AND** no support ticket is created

### Requirement: Widget-created tickets appear in the admin support queue
The system SHALL make tickets created from the help widget visible to the admin support queue without requiring a manual refresh.

#### Scenario: New widget ticket is persisted
- **WHEN** a widget-created support ticket is successfully persisted
- **THEN** the API publishes a support queue realtime event for authorized admin/support queue subscribers
- **AND** the admin support ticket list inserts or updates the ticket according to its active filters

#### Scenario: Realtime publish fails after creation
- **WHEN** ticket creation succeeds but realtime queue publication fails
- **THEN** the ticket remains available through the support ticket API
- **AND** the failure is observable without deleting the persisted ticket or first message

### Requirement: Widget support history is requester-scoped
The system SHALL show "Meus atendimentos" from persisted support tickets scoped to the current requester.

#### Scenario: User opens support history
- **WHEN** an authenticated user opens "Meus atendimentos" in the widget
- **THEN** the widget fetches persisted support tickets for that requester
- **AND** the list shows protocol, status, latest preview, updated time, and screenshot indicator when available

#### Scenario: Regular user has organization peers with tickets
- **WHEN** a regular user fetches widget support history
- **THEN** tickets requested by other organization users are not returned
- **AND** the user receives no organization support queue channel capability for those tickets

#### Scenario: User has no support tickets
- **WHEN** the requester-scoped support history is empty
- **THEN** the widget shows an empty state with a way to start a new support request

### Requirement: Widget can reopen authorized ticket conversations
The system SHALL allow a user to reopen support ticket conversations they are authorized to read.

#### Scenario: User opens one of their support tickets
- **WHEN** a user selects a ticket from widget support history
- **THEN** the widget fetches the canonical ticket detail from the API
- **AND** the widget renders the persisted message history in chronological order

#### Scenario: User attempts to open an unauthorized ticket
- **WHEN** a user requests a ticket they are not allowed to read
- **THEN** the API rejects the request
- **AND** the widget shows a recoverable error state without exposing ticket content

### Requirement: Widget sends ticket messages through the support API
The system SHALL send widget support chat messages through persisted support ticket message APIs.

#### Scenario: User sends a message in an open widget ticket
- **WHEN** the user submits a non-empty message in a widget support conversation
- **THEN** the API persists the message with the user's identity and user role
- **AND** the widget updates the conversation from the returned canonical ticket
- **AND** the admin support ticket detail receives the message through existing realtime delivery or subsequent API refetch

#### Scenario: Message submission fails
- **WHEN** a user message cannot be persisted
- **THEN** the widget keeps the draft or displays a retryable failure state
- **AND** no fake support reply is inserted as if the message succeeded

### Requirement: Widget receives support replies live
The system SHALL subscribe the widget to realtime updates for the active ticket conversation when realtime is available.

#### Scenario: Admin sends a reply to the active widget ticket
- **WHEN** an admin/support actor sends a message in a ticket the requester has open in the widget
- **THEN** the widget receives the ticket realtime event on the ticket-scoped private channel
- **AND** the widget appends or updates the message without a page refresh

#### Scenario: Widget reconnects after missed realtime events
- **WHEN** the widget realtime client reconnects after losing connection
- **THEN** the widget refetches the active ticket detail from the API
- **AND** the rendered conversation matches the canonical persisted messages

#### Scenario: Realtime is disabled
- **WHEN** realtime token creation reports that realtime is not enabled
- **THEN** the widget remains usable through API fetches and mutations
- **AND** the UI does not claim a live connection is active

### Requirement: Widget realtime access is ticket-scoped for regular users
The system SHALL authorize widget realtime tokens according to requester ticket access and SHALL avoid granting broad queue subscriptions to regular users.

#### Scenario: User requests realtime for their own ticket
- **WHEN** a regular authenticated user requests a realtime token for a ticket they requested
- **THEN** the API grants short-lived capability for that ticket channel
- **AND** the granted channels do not include the organization support queue channel

#### Scenario: User requests realtime for another requester's ticket
- **WHEN** a regular authenticated user requests realtime access to a ticket they cannot read
- **THEN** the API rejects the token request
- **AND** no channel capability is returned

### Requirement: Widget preserves support UX states
The system SHALL preserve the validated support widget experience while replacing local support data with API-backed tickets.

#### Scenario: Ticket creation is in progress
- **WHEN** the user submits a support intake request and the API call is pending
- **THEN** the widget shows a submitting state
- **AND** duplicate submissions are disabled until the operation settles

#### Scenario: Existing quick help is used
- **WHEN** the user uses normal contextual assistant messages or quick actions that are not support intake/history/chat
- **THEN** those flows continue to behave as contextual help
- **AND** they do not create support tickets unless the user explicitly enters the support flow

#### Scenario: Support UI renders Portuguese labels
- **WHEN** the widget renders support intake, support history, chat controls, errors, loading, or empty states
- **THEN** user-facing labels are in Portuguese
