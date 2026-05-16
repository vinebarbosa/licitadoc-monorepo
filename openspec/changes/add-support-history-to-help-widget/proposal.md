## Why

Users who ask for support from the help widget need a way to find what they already sent, reopen earlier support conversations, and understand whether a new issue is separate from a previous one. Without history, the widget behaves like a one-off chat and makes the user repeat context.

## What Changes

- Add a support history surface inside the existing floating help widget.
- Let users see previous support requests they opened, including protocol, status, latest message preview, timestamp, and attachment indicator when relevant.
- Let users open a previous support conversation and review the message history they sent before.
- Let users start a new support request from the history view without losing the current assistant/support navigation.
- Keep the first implementation frontend-local/demo-safe, using local seeded and current-session conversations until a real support backend exists.
- Keep the experience user-facing: focus on "meus atendimentos" and messages, not raw internal triage metadata.

## Capabilities

### New Capabilities
- `help-widget-support-history`: Defines support history inside the authenticated help widget, including previous support list, conversation reopening, user-sent message review, new-request entry point, empty state, and frontend-local behavior.

### Modified Capabilities
- None.

## Impact

- Affected app: `apps/web`.
- Likely touched areas: `apps/web/src/modules/help`, support model helpers, widget UI states, focused component tests, and targeted Playwright coverage.
- No backend API, database, generated API client, authentication, or real ticketing integration changes are expected for this initial slice.
- Future backend support should be able to replace the local history source without changing the primary widget UX.
