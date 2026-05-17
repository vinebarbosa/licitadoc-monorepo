## ADDED Requirements

### Requirement: Admin support queue time display is scannable
The admin support inbox SHALL present ticket freshness in queue rows and conversation/status tab surfaces using compact Portuguese labels that help admins decide what to open next.

#### Scenario: Admin reviews ticket queue rows
- **WHEN** an admin opens `/admin/chamados` and ticket rows are visible
- **THEN** each row shows a compact last-activity time based on the ticket's canonical `updatedAt`
- **AND** the time label does not displace the protocol, requester, subject, unread indicator, attachment marker, status, or priority indicators

#### Scenario: Ticket was updated today
- **WHEN** a ticket's last activity happened on the same local day as the current reference time
- **THEN** the queue uses a short relative label such as `agora`, `há 8 min`, or `há 2 h`
- **AND** the exact timestamp remains available through an accessible label or browser title

#### Scenario: Ticket was updated on another day
- **WHEN** a ticket's last activity happened before the current local day
- **THEN** the queue uses a compact calendar label such as `ontem`, weekday, or day/month according to available space
- **AND** the exact timestamp remains available through an accessible label or browser title

### Requirement: Admin chat timestamps are organized around the conversation
The admin support conversation SHALL show message timestamps in a consistent, low-noise layout that supports reading the chat history.

#### Scenario: Admin reads messages from a single day
- **WHEN** the selected ticket conversation contains messages from one local day
- **THEN** each user/support message shows a concise exact time such as `23:56`
- **AND** the timestamp is visually secondary to the message author and content

#### Scenario: Admin reads messages across multiple days
- **WHEN** the selected ticket conversation contains messages from more than one local day
- **THEN** the conversation separates or labels day changes so the admin can understand which date each message belongs to
- **AND** individual message timestamps remain concise inside each message group

#### Scenario: System messages appear in the conversation
- **WHEN** a system message appears in the selected ticket conversation
- **THEN** its time treatment stays compact and secondary
- **AND** it does not look like a user/support reply that needs action

### Requirement: SLA and elapsed time signals remain distinct
The admin support inbox SHALL keep SLA urgency, first-response due time, and last activity time visually distinct.

#### Scenario: Ticket is close to first response deadline
- **WHEN** a non-resolved ticket is near or past its first-response due time
- **THEN** the UI shows an SLA or attention signal separate from the last-activity timestamp
- **AND** the signal remains visible in queue/detail surfaces without replacing the ticket's last-activity time

#### Scenario: Ticket is resolved
- **WHEN** a ticket is resolved
- **THEN** SLA urgency does not appear as an active risk
- **AND** the ticket still shows a useful resolved or last-updated time for audit context

### Requirement: Admin time formatting remains deterministic and accessible
The system SHALL centralize support time formatting so tests, queue rows, chat messages, and realtime updates use consistent labels.

#### Scenario: Formatting helpers are tested
- **WHEN** support time helpers receive fixed ISO timestamps and a fixed reference time
- **THEN** they return deterministic Portuguese labels for same-minute, same-day, previous-day, older, and invalid/missing boundary cases

#### Scenario: Realtime message updates the selected ticket
- **WHEN** a realtime or API update adds a message or changes a ticket's `updatedAt`
- **THEN** the queue and chat use the same time-formatting rules as initially fetched tickets
- **AND** the UI avoids duplicate or conflicting time labels for the same event
