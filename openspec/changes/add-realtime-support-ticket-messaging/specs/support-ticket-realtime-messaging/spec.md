## ADDED Requirements

### Requirement: Support ticket messages are persisted before realtime delivery
The system SHALL persist support ticket messages in the application database before publishing any realtime delivery event.

#### Scenario: Message is sent successfully
- **WHEN** an authorized actor sends a message in a support ticket
- **THEN** the API stores the message with a stable id, author, role, content, and timestamp before returning the response
- **AND** the API publishes a realtime message event only after the database write succeeds

#### Scenario: Realtime publish fails after persistence
- **WHEN** the database write succeeds but the realtime provider publish fails
- **THEN** the message remains available through the support ticket detail API
- **AND** the API records the publish failure for observability without deleting the persisted message

### Requirement: Realtime delivery works without an app-hosted socket server
The system SHALL use an external realtime provider for browser socket subscriptions and SHALL NOT require the LicitaDoc runtime to host long-lived WebSocket connections.

#### Scenario: Browser subscribes to a ticket stream
- **WHEN** an authenticated client opens a support ticket conversation
- **THEN** the client obtains a scoped realtime token from the API
- **AND** the client subscribes to the provider-managed private ticket channel

#### Scenario: Serverless API publishes a support event
- **WHEN** a server-side support ticket mutation creates a realtime event
- **THEN** the API publishes the event to the external provider through server-side HTTP or provider SDK APIs compatible with serverless execution

### Requirement: Realtime channels are private and actor-scoped
The system SHALL authorize realtime tokens according to the same support ticket access rules used by the API.

#### Scenario: Actor can access requested ticket channel
- **WHEN** an authenticated actor requests a realtime token for a ticket they can access
- **THEN** the API returns a short-lived token scoped to that ticket channel

#### Scenario: Actor cannot access requested ticket channel
- **WHEN** an authenticated actor requests a realtime token for a ticket outside their permitted scope
- **THEN** the API rejects the token request
- **AND** the actor receives no channel capability for that ticket

#### Scenario: Actor can access organization queue updates
- **WHEN** an authenticated support actor requests realtime access to the support ticket queue for an organization they can administer
- **THEN** the API returns a short-lived token scoped to the organization support ticket queue channel

### Requirement: Support ticket UI reconciles realtime events with API state
The system SHALL treat API responses as canonical and SHALL reconcile realtime events with fetched ticket state.

#### Scenario: Message event is received
- **WHEN** the support ticket UI receives a realtime message-created event for the selected ticket
- **THEN** the UI displays the message without waiting for a full page refresh
- **AND** the UI avoids adding a duplicate when the message id already exists locally

#### Scenario: Client reconnects after missed events
- **WHEN** the realtime client reconnects after losing connection
- **THEN** the UI refetches the selected ticket and relevant ticket queue data from the API
- **AND** the UI reflects the canonical server state after reconciliation

### Requirement: Ticket queue metadata updates live
The system SHALL deliver live queue metadata updates for support tickets visible to the current actor.

#### Scenario: Ticket metadata changes
- **WHEN** ticket status, priority, assignee, update time, or unread count changes
- **THEN** the API publishes a queue metadata event to the authorized organization support ticket queue channel
- **AND** subscribed clients update the ticket list without a manual refresh

#### Scenario: Metadata event no longer matches current filters
- **WHEN** a realtime metadata event changes a ticket so it no longer matches the current queue filters
- **THEN** the UI removes or repositions the ticket according to the active filters and ordering

### Requirement: Typing indicators are realtime-only
The system SHALL provide typing indicators through realtime events without storing them as support ticket messages.

#### Scenario: Actor starts typing
- **WHEN** an actor types in the support ticket reply field
- **THEN** the client publishes or requests publication of a typing event for the ticket channel
- **AND** other subscribed clients show a temporary typing indicator for that actor

#### Scenario: Typing indicator expires
- **WHEN** no new typing event is received for the actor within the configured timeout
- **THEN** subscribed clients hide the typing indicator
- **AND** no support ticket message is created for the typing state

### Requirement: Support ticket read state updates consistently
The system SHALL update read or unread state through persisted API mutations and realtime queue notifications.

#### Scenario: Ticket is marked as read
- **WHEN** an actor opens a ticket or explicitly marks it as read
- **THEN** the API persists the actor's read state
- **AND** the API publishes an unread metadata update for affected support ticket views

#### Scenario: New inbound message arrives
- **WHEN** a new message is persisted from a different actor
- **THEN** the API updates unread counts for relevant recipients
- **AND** the support ticket UI receives a realtime metadata update reflecting the new unread state
