## ADDED Requirements

### Requirement: Admin support page MUST use a mature inbox/chat information architecture
The admin support page SHALL present support work as a conversation-first inbox rather than a dashboard-first management page.

#### Scenario: Admin opens support inbox on desktop
- **WHEN** an authenticated admin opens `/admin/chamados`
- **THEN** the page shows a full-height support workspace with a compact ticket queue, a dominant selected conversation, and a secondary context area
- **AND** the selected conversation is the primary visual surface of the page

#### Scenario: Operational counts are visible without dominating the page
- **WHEN** support ticket counts, status totals, SLA risk, or unread counts are shown
- **THEN** they are presented as compact queue aids such as tabs, chips, badges, or row indicators
- **AND** the page does not lead with large dashboard KPI cards

### Requirement: User-submitted media MUST appear inline in the conversation
The admin support page SHALL render screenshots, files, and other user-submitted evidence as part of the chat timeline.

#### Scenario: Ticket includes a screenshot sent by the user
- **WHEN** the selected ticket contains a screenshot attachment from the user
- **THEN** the chat timeline shows an inline attachment preview in the relevant user message or adjacent evidence bubble
- **AND** the preview includes enough context to identify the file, such as thumbnail, filename, type, or open affordance

#### Scenario: Evidence summary is shown outside the conversation
- **WHEN** the context panel mentions that evidence exists
- **THEN** it remains a secondary summary
- **AND** the media is still visible from the chat timeline without requiring the admin to inspect a separate evidence panel

### Requirement: Ticket queue MUST be compact, scannable, and actionable
The support inbox SHALL provide a dense queue that helps an admin decide what to handle next.

#### Scenario: Admin reviews the queue
- **WHEN** tickets are listed
- **THEN** each row shows the ticket protocol, requester, subject or latest message, status, priority or SLA signal, unread state when present, and attachment marker when present
- **AND** the selected row has a clear active state

#### Scenario: Admin filters or searches tickets
- **WHEN** the admin uses search, status tabs, priority filters, SLA filters, or assignment filters
- **THEN** the queue updates without navigating away from the selected support workspace
- **AND** the selected ticket remains valid or moves to the first matching ticket

### Requirement: Chat header and composer MUST expose common support actions
The support inbox SHALL let the admin handle a selected ticket from the conversation surface.

#### Scenario: Admin handles an active ticket
- **WHEN** an active ticket is selected
- **THEN** the chat header or immediate action area exposes the ticket identity, requester, SLA/online signal, assignee state, and primary actions such as assumir, resolver, or more actions
- **AND** the composer lets the admin type and send a support reply

#### Scenario: Admin attaches supporting material while replying
- **WHEN** the admin is composing a response
- **THEN** controls for attaching a file, adding a capture, or using a quick reply are available without hiding the message thread

#### Scenario: Admin handles a resolved ticket
- **WHEN** the selected ticket is resolved
- **THEN** the page makes the resolved state clear
- **AND** the admin can reopen the ticket from the conversation workflow when supported by the local state model

### Requirement: Context panel MUST support the conversation without competing with it
The admin support inbox SHALL show contextual details in a secondary surface that helps the admin answer the user.

#### Scenario: Admin reads selected ticket context
- **WHEN** a ticket is selected
- **THEN** the context area shows useful details such as user, organization, screen, route, process or document reference, SLA, and compact history
- **AND** the context area does not duplicate the entire conversation or become the only place to view user-submitted evidence

#### Scenario: Admin uses a constrained viewport
- **WHEN** the page is rendered on a constrained viewport
- **THEN** the context area can collapse into a drawer, sheet, or secondary view
- **AND** the conversation remains reachable as the primary working surface

### Requirement: Support inbox UI MUST feel native to LicitaDoc and remain accessible
The support inbox SHALL use the existing LicitaDoc visual language and remain usable through pointer and keyboard interactions.

#### Scenario: Page uses LicitaDoc theme tokens
- **WHEN** the support inbox renders
- **THEN** primary actions, active states, surfaces, borders, and radius align with the existing LicitaDoc theme tokens, including the petroleum-blue primary color and `0.5rem` radius
- **AND** the interface avoids a generic marketing dashboard look

#### Scenario: Keyboard user operates the support inbox
- **WHEN** a keyboard user navigates the queue, filters, header actions, attachment controls, and composer
- **THEN** all controls are reachable
- **AND** focus states are visible

#### Scenario: Admin changes ticket state locally
- **WHEN** the admin assigns, replies, resolves, reopens, or changes ticket status/priority using the inbox UI
- **THEN** the selected conversation, queue row, and local ticket state update consistently without requiring a backend support API
