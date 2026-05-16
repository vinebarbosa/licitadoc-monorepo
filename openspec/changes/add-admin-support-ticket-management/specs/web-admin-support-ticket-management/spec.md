## ADDED Requirements

### Requirement: Admin support tickets page MUST be admin-only
The web application MUST expose a support ticket management page for authenticated admin users and MUST prevent non-admin users from accessing it.

#### Scenario: Admin opens support tickets page
- **WHEN** an authenticated `admin` navigates to `/admin/chamados`
- **THEN** the system renders the admin support ticket management page
- **AND** the page appears inside the authenticated app shell

#### Scenario: Non-admin attempts to open support tickets page
- **WHEN** an authenticated `organization_owner` or `member` navigates to `/admin/chamados`
- **THEN** the system denies access using the existing unauthorized flow
- **AND** the support ticket management page is not rendered

#### Scenario: Admin sees support navigation
- **WHEN** an authenticated `admin` opens the app sidebar
- **THEN** the sidebar shows an administrative navigation item for support tickets
- **AND** selecting that item navigates to `/admin/chamados`

### Requirement: Admin page MUST show a manageable ticket queue
The support ticket management page SHALL show a ticket queue that helps the admin understand which support requests need attention first.

#### Scenario: Admin opens page with seeded tickets
- **WHEN** an admin opens `/admin/chamados`
- **THEN** the page shows support ticket summaries backed by deterministic frontend data
- **AND** each ticket summary includes a protocol-like reference, requester, subject, status, priority, latest activity, and unread or attachment indicators when available

#### Scenario: Admin reviews queue metrics
- **WHEN** support tickets are visible
- **THEN** the page shows compact metrics for open tickets, waiting tickets, resolved tickets, and tickets near or beyond the expected response time
- **AND** the metrics match the currently available deterministic ticket set

#### Scenario: Admin filters the queue
- **WHEN** the admin applies status, priority, assignee, source, or text filters
- **THEN** the ticket queue updates to show only matching tickets
- **AND** the selected ticket remains valid or moves to the first matching ticket

#### Scenario: Filters produce no results
- **WHEN** the active filters match no tickets
- **THEN** the page shows an empty queue state
- **AND** the detail panel does not show stale ticket details as if they still matched

### Requirement: Admin page MUST show ticket detail with requester context
The support ticket management page SHALL show a selected ticket workspace with conversation, requester context, and evidence needed to answer the user.

#### Scenario: Admin selects a ticket
- **WHEN** the admin selects a ticket from the queue
- **THEN** the page shows that ticket's subject, protocol, status, priority, requester, organization when available, source screen, route or page context, and latest activity
- **AND** the conversation messages appear in chronological order

#### Scenario: Ticket includes screenshot evidence
- **WHEN** the selected ticket has a screenshot attachment
- **THEN** the detail workspace shows a visual screenshot preview
- **AND** the preview is labeled as user-provided evidence

#### Scenario: Ticket has no attachment
- **WHEN** the selected ticket has no screenshot or file attachment
- **THEN** the detail workspace shows the rest of the ticket context without reserving a large empty attachment area

### Requirement: Admin MUST be able to handle tickets locally
The support ticket management page SHALL let the admin perform common support actions using deterministic frontend state in the initial implementation.

#### Scenario: Admin assigns ticket to self
- **WHEN** the admin activates the assign-to-me action on an unassigned ticket
- **THEN** the ticket assignee updates to the current admin identity in the page state
- **AND** the ticket remains selected

#### Scenario: Admin changes ticket priority
- **WHEN** the admin changes a selected ticket's priority
- **THEN** the selected ticket and queue summary show the new priority
- **AND** ticket metrics remain consistent with the updated local state

#### Scenario: Admin replies to active ticket
- **WHEN** the admin types a non-empty reply and submits it
- **THEN** the reply is appended to the selected ticket conversation as a support message
- **AND** the ticket latest activity and queue preview update
- **AND** submitting an empty or whitespace-only reply does not append a message

#### Scenario: Admin resolves a ticket
- **WHEN** the admin resolves an active selected ticket
- **THEN** the ticket status updates to resolved
- **AND** the conversation composer is disabled or replaced with resolved-state guidance
- **AND** the queue and metrics reflect the resolved status

#### Scenario: Admin reopens a resolved ticket
- **WHEN** the admin reopens a resolved selected ticket
- **THEN** the ticket status changes back to an active state
- **AND** the admin can send another reply

### Requirement: Initial admin support page MUST remain frontend-local
The initial admin support ticket management implementation SHALL run without a support-ticket backend contract.

#### Scenario: Page loads without support API
- **WHEN** the admin opens the support ticket management page
- **THEN** the page renders seeded deterministic tickets without making a new support-ticket API request
- **AND** all local actions complete within the frontend page state

#### Scenario: Admin reloads the page
- **WHEN** the admin reloads `/admin/chamados`
- **THEN** the page returns to the deterministic seeded ticket state
- **AND** the system does not imply that local changes were persisted across sessions

### Requirement: Admin support UI MUST be accessible and responsive
The support ticket management page SHALL remain readable, keyboard-operable, and usable across desktop and constrained viewports.

#### Scenario: Keyboard user manages tickets
- **WHEN** a keyboard user navigates the support ticket management page
- **THEN** filters, ticket rows or cards, action controls, composer controls, and status controls are reachable by keyboard
- **AND** focus states are visible

#### Scenario: Admin opens page on constrained viewport
- **WHEN** the page is rendered on a constrained viewport
- **THEN** the queue, selected ticket detail, conversation, and action controls remain readable
- **AND** the layout does not require horizontal scrolling
