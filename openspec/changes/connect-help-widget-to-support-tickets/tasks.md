## 1. API Contracts And Policies

- [x] 1.1 Add support ticket creation request/response schemas for widget-created tickets, including subject/content, context screen, route, source, optional entity label, and screenshot metadata.
- [x] 1.2 Add a `POST /api/support-tickets/` route that creates the support ticket and first user message in one operation.
- [x] 1.3 Add a requester-scoped support ticket list route or query mode for widget "Meus atendimentos".
- [x] 1.4 Refine support ticket read/list/realtime policies so regular users can access only their requested tickets while admin/support queue access remains organization-wide.
- [x] 1.5 Ensure ticket realtime token issuance grants regular users ticket-scoped channels only and does not grant organization queue channels from the widget flow.

## 2. API Persistence And Realtime

- [x] 2.1 Implement ticket creation service logic using existing support ticket and message tables with server-derived requester identity and organization.
- [x] 2.2 Persist screenshot/context metadata as support ticket attachment metadata when supplied by the widget.
- [x] 2.3 Publish realtime queue updates after successful widget ticket creation so admin lists can insert the new ticket live.
- [x] 2.4 Keep persistence successful if realtime publication fails, logging the publication failure for observability.
- [x] 2.5 Add API tests for ticket creation, empty content validation, requester-scoped listing, unauthorized read/list access, and realtime token scoping.

## 3. Generated Client And Web Data Hooks

- [x] 3.1 Regenerate the API client after adding support ticket create/requester-list contracts.
- [x] 3.2 Add web support API helpers/hooks for creating widget tickets and listing requester tickets.
- [x] 3.3 Reuse existing support message/read/typing/realtime hooks for widget ticket conversations.
- [x] 3.4 Add cache update helpers that dedupe messages by id and reconcile widget ticket detail/list data after mutations and reconnects.

## 4. Help Widget Integration

- [x] 4.1 Replace local support intake creation with the persisted ticket create mutation while keeping the existing widget UI structure.
- [x] 4.2 Replace seeded/session support history with requester-scoped API history, including loading, empty, error, and retry states.
- [x] 4.3 Reopen persisted tickets from "Meus atendimentos" and render canonical message history in chronological order.
- [x] 4.4 Send support chat replies through the support message API and avoid inserting fake support replies after API-backed sends.
- [x] 4.5 Subscribe the active widget ticket to ticket-scoped realtime updates and refetch canonical detail after reconnect.
- [x] 4.6 Preserve existing contextual assistant behavior for non-support quick help flows.

## 5. Web Tests And Validation

- [x] 5.1 Update MSW handlers/fixtures for support ticket creation, requester history, detail, messages, realtime tokens, and error states.
- [x] 5.2 Add focused widget tests for creating a ticket, preventing duplicate submission, opening history, unauthorized/error handling, and sending a message.
- [x] 5.3 Add web tests proving admin support list cache receives widget-created tickets through the existing realtime/cache path.
- [x] 5.4 Run API typecheck and focused support ticket API tests.
- [x] 5.5 Run web typecheck and focused help/support widget tests.
- [x] 5.6 Run API client typecheck after generation.
