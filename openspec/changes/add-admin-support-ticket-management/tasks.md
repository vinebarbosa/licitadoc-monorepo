## 1. Module and Model

- [x] 1.1 Create the support ticket management module structure with public page exports.
- [x] 1.2 Define support ticket, message, attachment, requester, status, priority, source context, assignee, and SLA model types.
- [x] 1.3 Add deterministic seeded ticket records that mirror widget-created support requests, including screenshot evidence and prior conversations.
- [x] 1.4 Implement model helpers for stats, filtering, search, ticket selection fallback, assignment, priority/status changes, replies, resolve, and reopen behavior.
- [x] 1.5 Add unit tests for model helpers and local state transitions.

## 2. Admin Page UI

- [x] 2.1 Build the admin support tickets page with compact metrics, filters, search, queue, selected-ticket detail, and conversation workspace.
- [x] 2.2 Render ticket summaries with protocol, requester, subject, status, priority, latest activity, unread state, and attachment indicators.
- [x] 2.3 Render selected ticket context with user, organization, screen, route/page context, SLA state, and screenshot preview when present.
- [x] 2.4 Add local action controls for assign-to-me, priority changes, status changes, resolving, reopening, and support replies.
- [x] 2.5 Ensure the empty-filter state, no-attachment state, resolved-ticket state, and disabled empty-reply state are visible and understandable.
- [x] 2.6 Make the layout responsive without horizontal scrolling and keep controls keyboard-operable with visible focus states.

## 3. Routing and Navigation

- [x] 3.1 Register `/admin/chamados` in the app router using the existing protected admin-only route pattern.
- [x] 3.2 Add a "Chamados" item to the admin sidebar navigation with active-state handling and an appropriate icon.
- [x] 3.3 Add router/sidebar tests for admin access, non-admin denial, and navigation visibility.

## 4. Verification

- [x] 4.1 Add component tests covering page render, filtering, ticket selection, assignment, reply, resolve, reopen, and empty states.
- [x] 4.2 Add a focused E2E test where an admin opens `/admin/chamados`, filters/selects a ticket, replies, and resolves it.
- [x] 4.3 Run formatting/lint checks for changed frontend files.
- [x] 4.4 Run focused unit tests for the support module and related router/sidebar coverage.
- [x] 4.5 Run the focused Playwright E2E coverage for the admin support ticket page.
