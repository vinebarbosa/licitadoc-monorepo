## Context

The first admin support implementation made `/admin/chamados` functional: admins can see seeded tickets, filter the queue, inspect context, reply, resolve, and reopen. After reviewing it visually, the interface still feels more like a generic admin dashboard than a support workspace. The user also called out that media should live in the chat itself.

This change uses the async v0 reference at https://v0.app/chat/kGSWHD07Ll3 as a visual direction, but implementation must continue to follow the repository's existing React/Vite module structure, shared UI primitives, app shell, and tests.

## Goals / Non-Goals

**Goals:**

- Make `/admin/chamados` feel like mature, operational support software.
- Prioritize the conversation over dashboard metrics or detached panels.
- Keep the queue compact, scannable, and useful for triage.
- Render user-submitted captures/files inline in the chat timeline.
- Keep context visible but secondary: user, route, process/document, SLA, and history should support the reply, not dominate the page.
- Preserve all existing local ticket actions and deterministic testability.
- Apply the LicitaDoc theme tokens directly so the page feels native to the app.

**Non-Goals:**

- Do not add support-ticket persistence, realtime chat, file storage, notifications, or backend APIs.
- Do not change help-widget ticket creation semantics.
- Do not introduce a separate public support portal.
- Do not add decorative dashboard cards or marketing-style hero content.

## Decisions

1. **Adopt a conversation-first inbox layout.**
   - Desktop should use a full-height three-zone workspace: compact queue on the left, chat in the center, context on the right.
   - The center chat column owns the main visual weight. The selected ticket header, message timeline, inline evidence, and composer should be visible without the operator hunting through panels.
   - Dashboard metrics should be removed or compressed into tabs/chips/status counts that help triage without becoming the page's main object.

2. **Treat user evidence as chat content.**
   - Attachments associated with user messages should render as message attachments inside the timeline, with thumbnail/preview, filename, type, and open/download affordance.
   - System events may note that a capture was attached, but the useful preview belongs in the message flow.
   - The right context panel may summarize that evidence exists, but it must not be the only place where the media appears.

3. **Keep the ticket queue dense and operational.**
   - Use compact rows with selected state, unread count, protocol, requester, subject, latest snippet, SLA/priority/status indicators, and attachment markers.
   - Search and filters should stay near the queue and avoid page-level form heaviness.
   - Rows should have clear hover/focus/active states and preserve keyboard operation.

4. **Make support actions feel immediate.**
   - The chat header should expose the selected ticket identity, requester state, SLA, assignee, and primary actions like assumir/resolver/reabrir.
   - The composer should support typing a reply, sending, attaching files/captures, and using quick responses without pushing the thread out of view.
   - Local state transitions should continue updating the queue, thread, and selected ticket in memory.

5. **Use the LicitaDoc theme without turning it into a one-color screen.**
   - Primary actions and important active states use the existing petroleum-blue primary token.
   - Surfaces should remain light, quiet, and high-contrast with restrained borders and neutral text.
   - The existing dark sidebar remains part of the page frame, but the support workspace itself should feel like a focused work surface.

6. **Collapse gracefully on smaller screens.**
   - At narrower widths, the queue can become a selectable list view and the context panel can become a drawer/sheet.
   - The chat should remain the default selected surface after a ticket is chosen.
   - The implementation should avoid horizontal scrolling and preserve readable message widths.

## Risks / Trade-offs

- **A WhatsApp-like pattern can look too casual** -> Use the interaction model, not consumer styling. Keep typography, spacing, borders, and action hierarchy enterprise-grade.
- **Removing large metrics may hide operational signal** -> Keep counts and SLA indicators in compact queue tabs/chips rather than big cards.
- **Inline media can make long threads heavy** -> Use compact previews with progressive disclosure for opening the full asset.
- **Frontend-local behavior may still look persisted** -> Keep implementation boundaries clear and tests deterministic until a support API is introduced.

## Migration Plan

- Refactor the existing support admin page in place.
- Keep seeded ticket data and local action helpers, adding or reshaping attachment/message fields only as needed for inline rendering.
- Update tests to assert the new information architecture and inline-media behavior.
- Rollback is limited to reverting the support page UI refactor and related test expectations.

## Open Questions

- Should the future persisted API store attachments as message-level assets or ticket-level assets with message references?
- Should admin quick replies be configurable later by organization or global support settings?
- When real-time support exists, should presence indicators represent the user, the admin, or both?
