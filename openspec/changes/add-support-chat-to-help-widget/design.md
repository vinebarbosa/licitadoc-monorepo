## Context

The authenticated web app already has a floating contextual help widget in `apps/web/src/modules/help`. It is rendered from the app shell, derives route-specific help context from the current path, and keeps its assistant conversation state local to the frontend. The current "Falar com suporte" quick action only adds a local assistant response, which makes it feel like another FAQ answer instead of a path to operational support.

This change extends the existing widget rather than creating a second floating surface. The v0 reference (`https://v0.app/chat/q5osxIXtAD7`) is useful for product shape: a compact support tab/flow, screen context chips, an estimated response time, a protocol-like identifier, message status affordances, and a clear way back to the assistant.

## Goals / Non-Goals

**Goals:**
- Make "Falar com suporte" open a dedicated support experience inside the existing widget.
- Preserve the assistant experience for contextual guidance, suggestions, quick actions, and deterministic responses.
- Give support enough visible context from the current screen so users trust they are asking about the right process, document, or workflow.
- Provide a polished frontend-local demo of support intake and chat states, including protocol, availability, typing/sending affordances, and return navigation.
- Keep the implementation accessible, responsive, and consistent with the existing design system and module boundaries.

**Non-Goals:**
- Build a real support backend, ticketing integration, websocket channel, or SLA engine.
- Persist support conversations across sessions or devices.
- Upload real files or screenshots.
- Replace the assistant with support chat; both modes should coexist.
- Change authentication, authorization, database schema, API client generation, or public routes.

## Decisions

### Add an explicit help mode for support

The widget should track a mode such as `assistant`, `support-intake`, and `support-chat` instead of treating support as a normal quick-action response.

- Rationale: users need to understand that "Falar com suporte" starts a different help path, with a human-support mental model and a stronger sense of accountability.
- Alternative considered: keep adding a canned assistant reply. That keeps the code small, but it does not solve the UX issue the user identified.

### Keep support state frontend-local for this slice

The first implementation should generate mock protocol data, seeded support messages, sending states, and support replies in the browser component tree.

- Rationale: the requested work is a product/demo slice and no support backend contract exists yet. Local behavior is testable and avoids creating a fake API boundary.
- Alternative considered: introduce a support service abstraction immediately. That would be premature without decisions about ticketing, routing, attachments, audit, and SLAs.

### Keep route context useful but not prominent to the user

Support intake should use the current help context and route-derived workflow details as support metadata, but it should not expose raw triage labels such as route, internal flow, or technical page metadata as the main user-facing content. The user-facing intake should prioritize actions that help the user explain the issue, such as attaching a screenshot of the current screen.

- Rationale: the widget already knows what screen the user is on, but raw route/context cards are more useful to support staff than to the requester. A screenshot action is more recognizable and useful for a blocked user.
- Alternative considered: display context cards for `Tela`, `Fluxo`, and `Rota`. That helps triage, but it makes the intake feel administrative instead of helpful.

### Provide a compact intake before chat

The support flow should first show a short intake state with support availability, estimated response copy, context summary, and a text area for the issue. Submitting the issue opens the chat state.

- Rationale: this matches the user's mental model of asking support for help and avoids dropping them into an empty chat with no prompt.
- Alternative considered: open the support chat immediately. That is faster, but users may not know what information to provide or whether context will be included.

### Keep navigation reversible

Support states should include a visible way to return to the assistant, and the widget controls should continue to support minimize and close behavior.

- Rationale: support is one branch of help, not a trap. The user specifically called out the importance of returning from expanded quick-action states in the previous iteration.
- Alternative considered: make support a terminal state until close. That would repeat the earlier UX issue and increase frustration.

## Risks / Trade-offs

- [Risk] Users may believe the simulated support chat reaches a real human. -> Mitigate with copy that says the first implementation is "pronta para atendimento" or "simulação de suporte" only where appropriate in demo/test copy, and avoid claiming a human has been notified until a backend exists.
- [Risk] The widget can become visually crowded with assistant, support intake, chat, quick actions, and input controls. -> Mitigate by showing one primary mode at a time and hiding assistant suggestions/actions while support is active.
- [Risk] Mock protocol and SLA details can become product promises. -> Mitigate by using conservative copy such as "tempo estimado" and keeping values centralized for later replacement.
- [Risk] Route context labels can be too generic or too technical for users. -> Mitigate by keeping raw context out of the primary intake UI and offering user-facing actions such as screenshot attachment.

## Migration Plan

1. Extend the help widget model with support mode/state helpers and support copy.
2. Update the "Falar com suporte" quick action to open support intake.
3. Add support intake UI inside the existing widget with context summary, issue text area, and clear return navigation.
4. Add support chat UI with protocol, simulated messages, send interaction, typing/sending affordances, and return-to-assistant behavior.
5. Update focused unit/component tests for support mode transitions and local chat behavior.
6. Update targeted browser coverage for opening support from the widget and returning to the assistant.
7. Roll back by removing the support mode additions and restoring the previous support quick-action response; no data migration is required.

## Open Questions

- Which support destination should back this flow later: internal ticketing, shared inbox, chat provider, or a LicitaDoc-owned support API?
- Should support receive route-only context, user-selected context chips, or a richer payload with process/document identifiers when available?
- Should support conversations be auditable for public-sector compliance once real backend support exists?
