## Context

The help widget now has an assistant flow, support intake, and support chat states inside `apps/web/src/modules/help`. Support chat is currently frontend-local: it generates protocol-like identifiers, mock messages, screenshot previews, typing feedback, and local replies without a real support backend.

The next user need is continuity. A person may open more than one support request, step away from the current chat, or want to remember what they already asked. The widget should therefore expose "meus atendimentos" in a compact, user-facing way without turning the panel into an internal ticketing console.

## Goals / Non-Goals

**Goals:**
- Add a support history entry point inside the existing widget support experience.
- Show previous support requests with protocol, status, timestamp, latest message preview, and attachment indicator when useful.
- Let users open a previous support request and review the messages they sent and received.
- Let users start a new support request from the history view.
- Include the current session's newly opened support request in the local history.
- Keep the first slice frontend-local and easy to replace with backend-backed support history later.

**Non-Goals:**
- Build support/ticketing backend APIs, database tables, websocket channels, or real persistence.
- Implement staff-side support queues, assignment, SLA enforcement, or internal notes.
- Add search, filters, tags, or bulk management for support history.
- Expose raw route metadata as the main historical record.
- Change authenticated app routing, public routes, or authorization behavior.

## Decisions

### Add a support history mode inside the widget

Introduce a widget mode such as `support-history` alongside `assistant`, `support-intake`, and `support-chat`. The history mode should render inside the same floating panel and reuse the existing close/minimize controls.

- Rationale: history is part of the support experience, not a separate page. Keeping it in the widget preserves the "ask for help without leaving work" mental model.
- Alternative considered: add a full support history page. That may be useful later, but it is too heavy for the current need and would force navigation away from the user's workflow.

### Make history user-facing, not operator-facing

Each history item should be phrased around what the user recognizes: subject/first message, protocol, latest reply preview, status, relative/short timestamp, and attachment indicator. Avoid labels like queue, route, internal flow, or triage metadata.

- Rationale: the user wants to recover their own conversations, not inspect support routing.
- Alternative considered: show rich ticket metadata. That could help future support staff, but it clutters a compact widget and repeats the previous issue with raw context cards.

### Use local seeded plus current-session history for the first slice

The first implementation should provide local support history data in the help module and append newly created support chats during the page session. The model should make it obvious where a future backend-backed history source would plug in.

- Rationale: the current support chat is frontend-local and no support API contract exists. Seeded/current-session history allows the UX to be validated immediately.
- Alternative considered: block the feature until backend persistence exists. That delays a clear UX improvement and mixes product discovery with infrastructure work.

### Reopen previous conversations as read-only by default

Opening a previous support request should show the conversation history and a clear status. If the request is shown as open/in-progress, the same message composer can remain available; if it is resolved/closed, the widget should guide the user to start a new support request.

- Rationale: users mainly need to see what was already sent, while still understanding when they should create a new case.
- Alternative considered: every previous thread is always writable. That can confuse resolved support requests and may not match future backend rules.

### Keep new-request creation obvious from history

History should include a "Novo atendimento" action so users can start fresh from the historical list without going back through quick actions.

- Rationale: once a user is thinking in support terms, they should not have to hunt for the quick action again.
- Alternative considered: only show history as a passive list. That creates dead-end navigation and adds friction.

## Risks / Trade-offs

- [Risk] Users may interpret local seeded history as real persisted support data. -> Mitigate with conservative demo copy and implementation boundaries that clearly centralize mock data for later backend replacement.
- [Risk] History can crowd the small widget. -> Mitigate with compact list rows, short previews, and one primary action per row.
- [Risk] Read-only previous conversations may feel limiting if users expect to continue a thread. -> Mitigate by allowing active/open local conversations to continue and offering a clear new-request path for closed ones.
- [Risk] The history source can diverge from future support API shapes. -> Mitigate by using explicit history record/message types that mirror likely ticket concepts: id/protocol/status/title/preview/timestamp/messages/attachments.

## Migration Plan

1. Add support history model types, local seeded history, and helper functions under the help module.
2. Add `support-history` state and navigation from the support/intake/chat experience.
3. Render a compact support history list with empty and populated states.
4. Let users open a previous support request and view its conversation.
5. Add current-session support requests to the history source when new support chats start.
6. Add focused unit/component tests and targeted browser coverage.
7. Roll back by removing the history mode and returning support navigation to intake/chat only; no data migration is required.

## Open Questions

- When a real backend exists, should resolved conversations allow replies or always require a new request?
- How long should support history be retained for public-sector audit and privacy expectations?
- Should users see only their own support requests or all requests opened by members of the same organization?
