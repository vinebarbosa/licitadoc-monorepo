## Why

Users can already ask for local guidance in the floating help widget, but the "Falar com suporte" action still behaves like another canned assistant answer. Users who are blocked in an operational workflow need a clearer path to contact support from the same widget, with enough screen context to feel safe and understood.

## What Changes

- Add a dedicated support-chat experience inside the existing floating help widget.
- Turn the "Falar com suporte" quick action into a support flow instead of only returning local guidance.
- Provide an entry state that explains what will be sent to support, captures the user's issue, and shows contextual details from the current screen.
- Provide a simulated chat state with protocol, support availability, message history, send controls, and a way to return to the local assistant.
- Keep the first implementation frontend-local and demo-safe, with deterministic mock support behavior until a real support/ticketing backend exists.
- Use the v0 support chat demo as a UX reference for compact, trustworthy, operational chat behavior.

## Capabilities

### New Capabilities
- `help-widget-support-chat`: Defines the support contact flow inside the authenticated floating help widget, including support entry, context capture, simulated support chat, navigation back to assistant help, accessibility, and frontend-local behavior.

### Modified Capabilities
- None.

## Impact

- Affected app: `apps/web`.
- Likely touched areas: `apps/web/src/modules/help`, app-shell focused tests, and targeted Playwright coverage for the widget support flow.
- No backend API, database, authentication, generated API client, or real-time messaging changes are expected in this proposal.
- Design reference: v0 chat `https://v0.app/chat/q5osxIXtAD7`.
