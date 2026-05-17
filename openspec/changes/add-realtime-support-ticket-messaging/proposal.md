## Why

The support ticket screen needs real-time conversation updates, but Vercel serverless functions are not a suitable place to hold long-lived WebSocket connections. LicitaDoc should use an external realtime provider so users and support agents can exchange ticket messages live while the application keeps its own database as the source of truth.

## What Changes

- Add real-time support ticket messaging backed by an external provider, initially Ably.
- Persist support tickets and ticket messages in the application database before publishing realtime events.
- Add server-side endpoints for listing tickets, sending messages, updating ticket metadata, and issuing scoped realtime tokens.
- Add private realtime channels for ticket-level updates, typing indicators, delivery/read state, and ticket metadata changes.
- Update the admin support ticket UI to use persisted API data plus realtime subscriptions instead of seeded local state.
- Keep Vercel/serverless compatibility by publishing from server-side code over provider REST APIs and subscribing from browser clients over provider-managed WebSockets.

## Capabilities

### New Capabilities
- `support-ticket-realtime-messaging`: Covers persisted support tickets, ticket conversations, scoped realtime provider integration, private channel authorization, and live support UI updates.

### Modified Capabilities
- None.

## Impact

- API app: new support ticket tables, routes, schemas, policies, services, realtime token endpoint, provider abstraction, and tests.
- Web app: support ticket data hooks, realtime client integration, admin support ticket UI, optimistic message handling, reconnection behavior, and tests.
- Infrastructure/config: Ably app credentials and environment variables for server REST publishing and client token authentication.
- Security: channel-scoped capabilities so users only subscribe to tickets they can access.
- API client: regenerate generated client types after adding support ticket contracts.
