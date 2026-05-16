## Why

The help widget now lets users open support conversations, but there is no trusted administrative workspace for the support operator to see, triage, and answer those requests. In this first phase, the admin user acts as support, so the product needs a clear admin page that turns user help requests into manageable tickets.

## What Changes

- Add an admin-only support ticket management page for admins to monitor and handle user support requests.
- Expose the page from the administrative navigation and route it under the existing protected admin area.
- Show a dense, operational ticket queue with status, priority, SLA/elapsed-time indicators, requester, source context, unread state, and attachment markers.
- Provide a ticket detail workspace with user context, route/screen context, screenshot preview, message history, and support actions.
- Allow the admin to assign a ticket to themselves, send replies, update priority/status, resolve active tickets, and reopen resolved tickets using deterministic frontend state for the initial implementation.
- Include filters and search for status, priority, assignee, source context, and free-text ticket lookup.
- Keep the initial implementation frontend-local and seeded until a persisted support-ticket API is defined.
- Use the async v0 demo as visual reference: https://v0.app/chat/uDq7N8Mmc0w

## Capabilities

### New Capabilities
- `web-admin-support-ticket-management`: Admin-facing support ticket management page, including route access, queue, detail view, support conversation controls, local state transitions, and responsive UI behavior.

### Modified Capabilities
- None.

## Impact

- Affected frontend areas:
  - `apps/web/src/app/router.tsx`
  - `apps/web/src/modules/app-shell/components/app-sidebar.tsx`
  - new support/admin module code under `apps/web/src/modules`
  - frontend tests and focused E2E coverage for the admin support page
- No backend API or generated API client changes in this first phase.
- No persisted cross-session support data until a future support-ticket API contract is introduced.
