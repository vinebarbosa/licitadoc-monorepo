## Why

The admin support ticket backend is now persisted and realtime-enabled, but the contextual help widget still opens local, simulated support conversations. Users need the widget to create and continue real support tickets so the admin queue receives the same conversation live.

## What Changes

- Connect the existing "Falar com suporte" flow in the contextual help widget to the persisted support ticket API.
- Add user-facing support ticket creation from widget context, creating the ticket and first user message in one canonical operation.
- Add a requester-scoped way for authenticated users to list and reopen their own support tickets from "Meus atendimentos".
- Reuse the existing ticket message, read, typing, and realtime token flows for widget conversations.
- Publish ticket-created and message-created realtime events so the admin support queue updates without refresh.
- Preserve the validated widget UI and contextual metadata: current screen, route, flow label, screenshot indicator/metadata, and Portuguese support copy.
- Replace seeded/session-only support history with API-backed data while keeping empty, loading, submitting, error, and offline-safe states.

## Capabilities

### New Capabilities
- `help-widget-support-ticket-integration`: Covers creating, listing, reopening, messaging, and receiving realtime updates for support tickets from the authenticated contextual help widget.

### Modified Capabilities
- None.

## Impact

- API app: support ticket creation route, requester-scoped listing/detail access, access policy refinements, realtime queue publication for new widget-created tickets, schemas, tests, and generated API client contracts.
- Web app: contextual help widget support flow, support history data source, ticket conversation hooks, realtime subscription reuse, cache reconciliation, MSW handlers, and focused widget tests.
- Realtime: existing Ably-backed provider remains the transport; normal users should receive ticket-scoped capabilities only, while admins keep organization queue access.
- Security: regular users must only see and subscribe to their own tickets unless their role already grants broader support administration.
- Data: no destructive migration is expected; the change should use the existing support ticket and message tables created for realtime support messaging.
