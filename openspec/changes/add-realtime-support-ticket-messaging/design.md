## Context

LicitaDoc already has an admin support ticket experience in the web app, but the current ticket data is local seeded state. The product direction is to make support tickets behave like live conversations between users and support agents.

The deployment constraint matters: Vercel serverless functions cannot host a durable Socket.IO or WebSocket server for long-lived connections. The application therefore needs an external realtime provider for socket delivery while keeping LicitaDoc's database as the source of truth for tickets, messages, read state, and ticket metadata.

The first provider will be Ably because it supports provider-managed WebSocket connections from the browser, REST publishing from server-side code, private channels, and scoped token authentication. The implementation should keep a small provider interface so the transport can be swapped later if needed.

## Goals / Non-Goals

**Goals:**

- Persist support tickets and messages in the API database before any realtime event is published.
- Use an external realtime provider for browser subscriptions so the app remains compatible with Vercel/serverless.
- Authorize realtime access with short-lived, channel-scoped tokens.
- Update the existing support ticket UI with API-backed data and live events without reinventing the validated layout.
- Reconcile realtime events with canonical API fetches after load, reconnect, and mutation failures.
- Support live message delivery, ticket metadata updates, unread/read state, and typing indicators.

**Non-Goals:**

- Build or host a custom WebSocket server in the application runtime.
- Treat the realtime provider as the persistence layer for messages.
- Replace the existing admin support UI with a new design direction.
- Introduce an event queue or background job system for this change.
- Build a full external helpdesk product integration.

## Decisions

### Use an external realtime provider with a local abstraction

LicitaDoc will add a realtime provider module with an Ably implementation behind a narrow interface for publishing events and issuing scoped tokens.

Rationale: the app needs provider-managed WebSockets in the browser and REST publishing from serverless functions. Keeping a local interface prevents Ably concepts from leaking through the support module and leaves room for Pusher or another provider later.

Alternatives considered:

- Self-hosted Socket.IO: rejected because it conflicts with Vercel/serverless constraints.
- Supabase Realtime as the first provider: viable, but it couples realtime more tightly to Supabase/Postgres behavior than the current request needs.
- Polling only: simpler, but it does not satisfy the live conversation experience.

### Persist first, publish second

Message creation and ticket metadata updates will write to the database first. After the mutation succeeds, the API publishes a lightweight realtime event through the provider REST API.

Rationale: the application database remains the source of truth. If publishing fails, the message still exists and clients can recover by fetching the ticket detail.

Alternatives considered:

- Publish before persistence: rejected because clients could see events for data that later fails to save.
- Store message history only in the provider: rejected because it would split domain data away from the LicitaDoc database.

### Use private, scoped channels

The channel model will separate ticket detail streams from list-level organization streams:

- `private:ticket:{ticketId}` for message events, typing indicators, read receipts, and selected ticket updates.
- `private:org:{organizationId}:support-tickets` for queue metadata such as status, priority, assignee, and unread count updates.

The token endpoint will validate the authenticated actor's access before granting capabilities for those channels.

Rationale: ticket messages can contain support context, user identity, screenshots, and document/process references. Channel authorization must match API authorization.

Alternatives considered:

- Public channels with client-side filtering: rejected because unauthorized users could still receive sensitive payloads.
- One global admin channel: rejected because it is harder to scope, test, and reason about.

### Keep payloads lightweight and reconcile from the API

Realtime events will include stable identifiers, timestamps, event type, and the minimum denormalized data needed for instant UI updates. Clients will still fetch canonical ticket data on page load, reconnect, and selected mutation completion.

Rationale: this prevents duplicate/out-of-order events from corrupting UI state and avoids making the realtime provider a second API.

Alternatives considered:

- Full ticket snapshots in every event: rejected because payloads become larger, harder to version, and more likely to expose unnecessary data.
- Event-only client state: rejected because missed events during reconnect would leave the UI stale.

### Typing indicators are ephemeral

Typing indicators will be published as realtime-only events and will expire client-side if not refreshed. They will not be stored as ticket messages.

Rationale: typing state is transient feedback, not domain history.

Alternatives considered:

- Persist typing state: rejected because stale typing state is common and not valuable historically.

## Risks / Trade-offs

- Provider outage -> messages and ticket updates still persist in the database; clients recover through API fetches and can fall back to manual refresh or polling.
- Unauthorized subscriptions -> token issuance must reuse the same support ticket access checks as the API routes and grant only the required channel capabilities.
- Duplicate or out-of-order events -> clients must deduplicate by message/event id and reconcile from server timestamps.
- Vendor lock-in -> the provider interface should isolate Ably-specific SDK calls, token formats, and publish details.
- Serverless latency -> API mutations publish through provider REST after commit; the UI should show optimistic local feedback while waiting.
- Token leakage -> tokens must be short-lived and scoped to the current organization/ticket channels.

## Migration Plan

1. Add support ticket persistence tables and API routes while keeping the seeded UI available during implementation.
2. Add the realtime provider interface, Ably configuration, and scoped token endpoint.
3. Publish support ticket events after successful database mutations.
4. Replace the seeded web state with API hooks and realtime subscriptions in the existing admin support ticket UI.
5. Configure Ably credentials in deployed environments.
6. Regenerate API client types and run targeted API/web tests.

Rollback strategy: disable realtime subscriptions through configuration and keep the API-backed support ticket UI functional through normal fetches. Since messages are persisted locally before publish, disabling the provider does not require data rollback.

## Open Questions

- Should end users also have a support inbox in the first implementation, or is this change limited to the admin support queue plus the message capture points?
- Which roles can access all organization tickets versus only their own submitted tickets?
- Should attachments be included in the first persistence migration or kept as metadata links until upload storage is finalized?
