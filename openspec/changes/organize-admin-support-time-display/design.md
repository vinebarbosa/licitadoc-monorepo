## Context

The admin support inbox already shows multiple time-related signals:

- queue rows show `formatSupportRelativeTime(ticket.updatedAt)`;
- chat bubbles show `formatSupportRelativeTime(message.timestamp)`;
- status tabs show counts, while SLA indicators and context cards show response risk;
- realtime updates can change ticket order and message timestamps while the admin is reading.

Those signals are useful, but they need a clearer hierarchy. The queue should answer "what changed recently?", the chat should answer "when did this message happen?", and SLA/context surfaces should answer "what needs action soon?".

## Goals / Non-Goals

**Goals:**
- Standardize support inbox time formatting in one helper layer.
- Make queue rows and conversation/status tabs easier to scan by separating freshness from SLA urgency.
- Make chat timestamps readable, stable, and less visually noisy.
- Keep all labels in Portuguese and compatible with the existing LicitaDoc UI.
- Add focused tests for formatting boundaries and rendered admin inbox behavior.

**Non-Goals:**
- Do not change persisted support ticket timestamps.
- Do not alter realtime event contracts or channel behavior.
- Do not introduce a date/time dependency unless the existing stack already uses one and it clearly reduces complexity.
- Do not redesign the whole admin inbox layout beyond the time surfaces.

## Decisions

- Add explicit support time display helpers in the support model layer.
  - Rationale: both queue rows and chat messages need the same deterministic formatting rules and tests.
  - Alternative considered: keep formatting inline in `admin-support-tickets-page.tsx`. That would make the visual rules harder to test and easier to diverge.

- Use relative time for queue freshness and exact time for chat messages.
  - Rationale: queue scanning benefits from "agora", "há 12 min", or "ontem"; chat reading benefits from concrete message time, such as `23:56` with a date when messages cross days.
  - Alternative considered: exact time everywhere. That is precise but slower to scan in a queue.

- Keep SLA time separate from last activity.
  - Rationale: "last activity" and "needs attention" answer different questions. Merging them into one label can make resolved or waiting tickets appear incorrectly urgent.
  - Alternative considered: one combined text like `há 8 min · SLA vencido`. This is useful in small places but should be backed by separate helper output so the UI can prioritize one or the other depending on space.

- Prefer compact text and native titles/ARIA labels for extra precision.
  - Rationale: admin rows are dense, and exact timestamps should be available without crowding the row.
  - Alternative considered: show full date/time in every row. That makes the queue heavier and reduces room for subject/requester content.

## Risks / Trade-offs

- Relative times depend on "now" and can make tests flaky -> keep helper functions deterministic by accepting an optional reference timestamp and use fixed fixture dates in tests.
- Compact labels can hide precision -> expose exact timestamps through accessible labels or `title` attributes where appropriate.
- Timezone assumptions can confuse users -> format using the browser locale/timezone for display while keeping persisted ISO timestamps untouched.
- Realtime updates can reorder rows unexpectedly -> preserve current ordering behavior but ensure refreshed timestamps use the same helper rules.
