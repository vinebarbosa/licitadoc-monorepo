## Context

LicitaDoc now has support ticket persistence, API routes, generated client hooks, and Ably-backed realtime delivery for the admin support screen. The contextual help widget still uses seeded/session-local support records, deterministic replies, and generated protocols, so a user can appear to contact support without creating anything visible to `/admin/chamados`.

The widget already captures the right product context: current screen title, route, flow subtitle, source area, optional entity label, and screenshot indicator. The implementation should keep the validated widget UI and swap the support data source from local state to the support ticket backend.

One security detail is important before coding: the current support ticket API is broad enough for the admin queue. The widget needs a requester-scoped surface so regular users can see their own support conversations without receiving organization-wide support tickets or queue channels.

## Goals / Non-Goals

**Goals:**

- Let authenticated users create a real support ticket from the help widget, including the first message and contextual metadata.
- Make widget-created tickets appear live in the existing admin support queue.
- Let users view and reopen their own tickets from "Meus atendimentos".
- Let users send and receive ticket messages in the widget through the same persisted API and ticket realtime channel used by the admin support UI.
- Keep the current widget layout, Portuguese copy direction, and contextual workflow intact.
- Keep Ably as an external realtime provider and keep the database as the source of truth.

**Non-Goals:**

- Redesign the help widget or admin support page.
- Build a new custom socket server or introduce a queue/event worker.
- Add anonymous/public support outside authenticated app sessions.
- Build a full attachment upload pipeline; screenshot support can remain metadata unless storage already exists.
- Add SLA automation, assignment routing, or external helpdesk integrations.

## Decisions

### Add a first-class create ticket endpoint

Add a support route that creates a ticket and its first user message in one server-side operation. The server derives requester identity and organization from the authenticated actor, accepts only the widget's allowed contextual fields, persists the ticket/message, then publishes realtime events.

Rationale: a single operation avoids creating empty tickets, keeps protocol generation canonical, and makes the first user message available to the admin queue immediately.

Alternatives considered:

- Reuse only the existing message endpoint: rejected because there is no ticket id before the widget creates the first request.
- Let the browser generate protocol/ticket records locally: rejected because persistence, identity, and realtime authorization must be server-owned.

### Add requester-scoped ticket access for the widget

Add a requester-scoped list endpoint, or equivalent query mode, for "Meus atendimentos". Regular users using the widget should receive only tickets where they are the requester. Admin/support roles can keep the existing organization queue behavior.

Rationale: the admin page needs organization-wide queue visibility, but the widget is a personal support surface. Sharing the admin list endpoint unchanged risks leaking organization support conversations to normal members.

Alternatives considered:

- Reuse `GET /api/support-tickets/` for the widget: rejected unless policies are narrowed, because the current behavior is queue-oriented.
- Store separate widget-only history: rejected because the point of the change is one canonical support ticket system.

### Reuse ticket channels, not queue channels, for normal users

The widget should subscribe only to `private:ticket:{ticketId}` for the active conversation. Organization queue channel access should remain reserved for support/admin surfaces that need queue updates.

Rationale: ticket channels are naturally scoped to conversations the user owns. Queue channels are broader and include metadata for tickets a requester should not see.

Alternatives considered:

- Subscribe widget clients to organization queue channels and filter locally: rejected because unauthorized events would still reach the browser.
- Poll only for replies: rejected because the validated support experience depends on live conversation feedback, and the provider is already available.

### Treat API data as canonical and keep realtime as acceleration

The widget should fetch canonical ticket lists/details from the API on open, after create/send mutations, and after reconnect. Realtime events update the local cache optimistically but must dedupe by message id and reconcile through refetch when needed.

Rationale: the realtime provider can miss events during reconnect or fail after persistence. The API/database remains the durable state.

Alternatives considered:

- Keep conversation state only in realtime messages: rejected because it duplicates persistence concerns and breaks reload/history.
- Refetch everything after every event: safe but unnecessarily slow; targeted cache updates plus reconnect refetch keep the UI fluid.

### Keep local assistant behavior separate from real support

The local helper/assistant mode can remain deterministic for quick guidance. Only the support intake, support chat, and support history modes should move to API-backed tickets.

Rationale: this change is about connecting real support, not replacing the contextual assistant or its quick actions.

Alternatives considered:

- Replace the full help widget with support tickets: rejected because the existing assistant surface is useful and already validated.

## Risks / Trade-offs

- Regular user sees organization-wide tickets -> add requester-scoped endpoints/policies and tests for member access boundaries.
- Admin queue does not update for new widget ticket -> publish a ticket-created or ticket-updated queue event after create, and assert cache insertion in web tests.
- Realtime publish fails after ticket creation -> keep ticket/message persisted and rely on API refetch; log publish failure.
- Duplicate messages after optimistic mutation and realtime event -> dedupe by stable message id when updating cached ticket details.
- Widget loses selected ticket on route changes -> keep active ticket state separate from route-derived context and refetch by ticket id when reopening.
- Screenshot metadata implies uploaded file availability -> label it as contextual metadata unless an actual upload artifact exists.

## Migration Plan

1. Add API schemas, route handlers, service logic, and policies for widget-created tickets and requester-scoped listing.
2. Publish realtime events after ticket creation and reuse existing message/read/typing publish paths.
3. Regenerate the API client.
4. Replace local support history/chat state in the widget with API hooks and realtime subscriptions while preserving UI structure.
5. Add API and web tests for create, list ownership, message delivery, admin queue insertion, and widget error/loading states.
6. Deploy with existing realtime environment variables; if realtime is disabled, keep API-backed support functional through fetch/refetch.

Rollback strategy: leave the database tickets intact and temporarily switch the widget back to API fetch-only or disable the support entry action. No destructive data rollback is required.

## Open Questions

- Should the widget show all requester tickets, or only unresolved tickets plus a small resolved history?
- Should screenshot capture become a real upload in this slice, or remain metadata until storage is designed?
- Should organization owners using the widget see only their own requests, or should their role expose broader support queue access only on `/admin/chamados`?
