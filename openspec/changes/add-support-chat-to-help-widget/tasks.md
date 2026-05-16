## 1. Support State Model

- [x] 1.1 Extend the help widget state model with assistant, support intake, and support chat modes.
- [x] 1.2 Add local support conversation types for protocol, messages, sender, timestamps, and sending/typing state.
- [x] 1.3 Add support copy/helpers for initial intake text, deterministic support replies, protocol display, and estimated response text.
- [x] 1.4 Derive support context labels from the current `HelpContext` and route without scraping DOM content.

## 2. Support Intake UI

- [x] 2.1 Update the "Falar com suporte" quick action to open support intake instead of only adding a canned assistant response.
- [x] 2.2 Build the support intake state inside the existing floating widget with support availability, context summary, and issue input.
- [x] 2.3 Prevent empty issue submissions while keeping the issue field usable and accessible.
- [x] 2.4 Submit a valid issue into local support chat state with the issue included in conversation history.
- [x] 2.5 Add a visible control to return from support intake to the assistant experience.

## 3. Support Chat UI

- [x] 3.1 Build the support chat header/content with protocol-like reference, support status or identity, and message history.
- [x] 3.2 Add local support message submission with empty-message guard, sending feedback, and deterministic support reply.
- [x] 3.3 Keep minimize, close, and reopen behavior usable while support states are active.
- [x] 3.4 Add a visible control to return from support chat to the assistant experience.
- [x] 3.5 Ensure the support states fit the current widget dimensions without horizontal scrolling or overlapping controls.

## 4. Tests and Verification

- [x] 4.1 Add or update unit tests for support helper/model behavior.
- [x] 4.2 Add or update component tests for opening support intake, submitting an issue, sending chat messages, and returning to assistant mode.
- [x] 4.3 Add or update targeted Playwright coverage for the authenticated widget support flow.
- [x] 4.4 Run focused formatting, typecheck, unit/component tests, and targeted e2e validation for the help widget.
