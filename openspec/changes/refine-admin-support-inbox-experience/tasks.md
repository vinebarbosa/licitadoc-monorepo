## 1. v0 Reference and UX Direction

- [x] 1.1 Review the async v0 demo at https://v0.app/chat/kGSWHD07Ll3 and extract the useful layout, density, hierarchy, and interaction patterns.
- [x] 1.2 Compare the generated reference against the existing LicitaDoc app shell and keep only patterns that fit the current design system.
- [x] 1.3 Confirm the page direction removes the dashboard-first feel and makes the conversation the primary surface.

## 2. Inbox Layout Refactor

- [x] 2.1 Refactor `/admin/chamados` into a full-height support inbox with compact queue, dominant chat, and secondary context panel.
- [x] 2.2 Replace large dashboard metric cards with compact queue aids such as status tabs, chips, badges, or row indicators.
- [x] 2.3 Make the ticket queue dense and scannable with selected, hover, focus, unread, SLA, priority, and attachment states.
- [x] 2.4 Redesign the chat header to show requester/chamado identity, SLA/online signal, assignment, and primary actions in one compact row.
- [x] 2.5 Keep the right context panel useful but visually secondary to the conversation.

## 3. Inline Media and Message Timeline

- [x] 3.1 Adjust the support ticket model or message rendering so screenshot/file attachments can be associated with chat timeline entries.
- [x] 3.2 Render user-submitted captures/files inline in the message thread with preview, filename/type, and open affordance.
- [x] 3.3 Remove any separate media/evidence area as the primary way to view user-submitted attachments.
- [x] 3.4 Preserve useful context summaries without duplicating the full evidence experience outside the chat.

## 4. Actions and Responsive Behavior

- [x] 4.1 Preserve local actions for assign-to-me, priority/status updates, replies, resolve, and reopen inside the new inbox interaction model.
- [x] 4.2 Polish the composer with reply input, send action, attachment/capture controls, and quick replies that do not push the thread out of view.
- [x] 4.3 Add responsive behavior where the queue and context panel collapse appropriately while keeping the chat primary.
- [x] 4.4 Verify pointer, hover, and keyboard focus states across queue rows, actions, attachments, filters, and composer controls.

## 5. Verification

- [x] 5.1 Update support model and UI tests for inbox layout behavior, inline media rendering, queue selection, and local state transitions.
- [x] 5.2 Update the focused Playwright scenario to cover the mature inbox flow, including inline screenshot/media in the chat.
- [x] 5.3 Run formatting/lint checks for changed frontend files.
- [x] 5.4 Run focused unit tests for the support module.
- [x] 5.5 Run the focused E2E coverage for `/admin/chamados`.
