## 1. Backend Persistence

- [x] 1.1 Add support ticket database tables for tickets, messages, read state, and attachment metadata as needed.
- [x] 1.2 Add support ticket schema types for status, priority, source, requester, assignee, messages, and realtime event payloads.
- [x] 1.3 Implement API routes for listing tickets, reading ticket detail, creating messages, updating ticket metadata, assigning tickets, and marking tickets read.
- [x] 1.4 Add support ticket authorization policies for organization users, submitted-ticket users, and support/admin actors.
- [x] 1.5 Add API tests covering message persistence, ticket metadata mutations, unread/read state, and unauthorized access.

## 2. Realtime Provider

- [x] 2.1 Add a realtime provider interface for publishing events and issuing scoped client tokens.
- [x] 2.2 Add an Ably provider implementation and environment configuration for server-side publishing.
- [x] 2.3 Add a realtime token endpoint that validates ticket or organization access before granting private channel capabilities.
- [x] 2.4 Publish message-created, ticket-updated, typing, and read-state events after successful support ticket mutations.
- [x] 2.5 Add tests for token scoping, publish-after-persist behavior, publish failure handling, and denied channel access.

## 3. Web Support Experience

- [x] 3.1 Replace seeded-only support ticket state with API-backed query hooks while preserving the existing support ticket UI structure.
- [x] 3.2 Add a realtime client hook that obtains scoped tokens, subscribes to ticket and organization queue channels, and cleans up subscriptions.
- [x] 3.3 Apply realtime message events to the selected ticket without duplicating messages already present in local state.
- [x] 3.4 Apply realtime queue metadata events to status, priority, assignee, updated time, and unread counts in the ticket list.
- [x] 3.5 Add typing indicator behavior with client-side expiry and no persisted ticket message.
- [x] 3.6 Reconcile selected ticket and queue state through API refetch on initial load, reconnect, and relevant mutation completion.

## 4. Validation And Delivery

- [x] 4.1 Regenerate the API client after adding support ticket contracts.
- [x] 4.2 Add or update MSW fixtures and web tests for API-backed support tickets and realtime event handling.
- [x] 4.3 Run targeted API tests for support ticket persistence and realtime authorization.
- [x] 4.4 Run targeted web tests for the support ticket page and realtime hooks.
- [x] 4.5 Run typechecks for API, web, and generated API client packages.
- [x] 4.6 Document required realtime environment variables and deployment notes for Vercel.
