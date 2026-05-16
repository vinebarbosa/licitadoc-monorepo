## 1. Support History Model

- [x] 1.1 Add support history record/message types that cover protocol, status, title, latest preview, timestamp, messages, and screenshot attachment indicators.
- [x] 1.2 Add seeded local support history data for demo-quality previous support requests.
- [x] 1.3 Add helpers to create a history entry from a submitted support intake.
- [x] 1.4 Add helpers to update a history entry when a user sends a new message in an active support chat.

## 2. Widget State and Navigation

- [x] 2.1 Extend the help widget modes with a support history state.
- [x] 2.2 Add a visible "Meus atendimentos" entry point from the support experience.
- [x] 2.3 Add navigation from support history back to the assistant or prior support state.
- [x] 2.4 Add a "Novo atendimento" action from support history that opens support intake.

## 3. Support History UI

- [x] 3.1 Build a compact support history list with protocol, status, timestamp, latest preview, and attachment indicator.
- [x] 3.2 Build an empty state with a clear action to start a new support request.
- [x] 3.3 Let users open a previous support request from the history list.
- [x] 3.4 Render reopened support conversations with historical messages in chronological order.
- [x] 3.5 Show closed/resolved request affordances and guide users to start a new request when appropriate.
- [x] 3.6 Keep active history conversations locally writable when the request is active.

## 4. Current Session Integration

- [x] 4.1 Add newly submitted support requests to support history during the page session.
- [x] 4.2 Update the matching history entry when the user sends a support chat message.
- [x] 4.3 Preserve minimize, close, and reopen behavior across support history states.
- [x] 4.4 Ensure history and reopened conversation layouts remain compact without horizontal scrolling.

## 5. Tests and Verification

- [x] 5.1 Add or update unit tests for support history helpers and seeded data.
- [x] 5.2 Add or update component tests for opening history, empty/populated states, opening previous conversations, starting a new request, and appending current-session requests.
- [x] 5.3 Add or update targeted Playwright coverage for support history inside the authenticated help widget.
- [x] 5.4 Run focused formatting, typecheck, unit/component tests, and targeted e2e validation for the help widget.
