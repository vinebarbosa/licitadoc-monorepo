## ADDED Requirements

### Requirement: Admin queue status metrics MUST be independent from the active status tab
The admin support inbox MUST show status counts for the current queue scope without narrowing those counts by the selected status tab.

#### Scenario: Admin opens all tickets
- **WHEN** an admin opens `/admin/chamados` with no status tab selected beyond "Todos"
- **THEN** the status tabs show the scoped totals for all tickets, open tickets, waiting tickets, and resolved tickets
- **AND** the sum of open, waiting, and resolved counts equals the "Todos" count

#### Scenario: Admin selects resolved tickets
- **WHEN** an admin selects the "Resolvidos" status tab
- **THEN** the visible queue shows only resolved tickets
- **AND** the "Abertos", "Aguardando", and "Resolvidos" tab counts still reflect the same queue scope before applying the selected status tab
- **AND** active ticket counts are not replaced with zero just because the resolved tab is active

#### Scenario: Admin selects open tickets
- **WHEN** an admin selects the "Abertos" status tab
- **THEN** the visible queue shows only open tickets
- **AND** the resolved count remains visible and accurate for the current queue scope

### Requirement: Non-status filters MUST scope queue metrics
The admin support inbox MUST apply non-status filters consistently to both the visible queue and the status metrics.

#### Scenario: Admin filters by source
- **WHEN** an admin selects a source filter such as "Documentos"
- **THEN** the visible queue is limited to tickets from that source
- **AND** the status tab counts are recalculated for that source across all statuses

#### Scenario: Admin searches the queue
- **WHEN** an admin searches by protocol, requester, screen, or route
- **THEN** the visible queue is limited to matching tickets
- **AND** the status tab counts are recalculated for the search result scope across all statuses

#### Scenario: Admin combines filters with a status tab
- **WHEN** an admin applies search, priority, assignee, or source filters and then selects a status tab
- **THEN** the visible queue applies every selected filter
- **AND** the status tab counts apply the non-status filters but do not apply the selected status tab

### Requirement: Queue summary MUST distinguish visible tickets from scoped tickets
The admin support inbox MUST make clear how many tickets are currently visible and how many tickets exist in the scoped queue.

#### Scenario: Status tab filters the visible queue
- **WHEN** a selected status tab hides some tickets from the scoped queue
- **THEN** the queue summary indicates the visible count relative to the scoped total
- **AND** the summary does not imply that hidden statuses no longer exist

#### Scenario: Filters match no tickets for selected status
- **WHEN** non-status filters match tickets in the scope but the selected status tab has no matching tickets
- **THEN** the queue list shows the existing empty state for the selected status
- **AND** the status tabs still show which other statuses have matching tickets

### Requirement: Attention count MUST remain scoped and status-safe
The admin support inbox MUST show the attention count for active tickets in the current non-status filter scope.

#### Scenario: Resolved tab is selected
- **WHEN** an admin selects the "Resolvidos" status tab
- **THEN** the attention badge is not calculated only from resolved visible tickets
- **AND** it continues to reflect active tickets in the current non-status filter scope that are near or beyond the expected response time

#### Scenario: Non-status filters reduce attention items
- **WHEN** an admin applies priority, assignee, source, or search filters
- **THEN** the attention badge reflects only tickets matching those filters

### Requirement: Metrics MUST stay current after ticket changes
The admin support inbox MUST update queue metrics after support ticket mutations or realtime ticket events can change status, assignee, priority, unread, or SLA-relevant state.

#### Scenario: Admin resolves an open ticket
- **WHEN** an admin resolves an open ticket
- **THEN** the visible queue, selected ticket detail, and status tab counts update to reflect the resolved status

#### Scenario: Realtime event changes ticket status
- **WHEN** the admin inbox receives a realtime ticket update event that changes a ticket status
- **THEN** the status tab counts are refreshed or recalculated so they match the updated ticket state

### Requirement: Metric labels MUST remain readable and localized
The admin support inbox MUST present status metric labels in localized Portuguese copy without truncating important meaning at the validated page widths.

#### Scenario: Admin views status tabs
- **WHEN** the status tabs render in the support queue panel
- **THEN** labels for "Todos", "Abertos", "Aguardando", and "Resolvidos" are readable at the current desktop queue width
- **AND** the active tab remains visually clear

#### Scenario: Admin views attention badge
- **WHEN** the attention badge renders near the queue heading
- **THEN** its label follows the app's Portuguese copy policy
- **AND** the count remains visually associated with that label
