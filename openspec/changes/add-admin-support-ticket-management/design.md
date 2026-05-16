## Context

The authenticated app already has an admin area with protected routes and sidebar navigation. The help widget support flow is currently frontend-local: it creates protocol-like records, messages, screenshot previews, and support history without a persisted backend contract. The new page must give admins a realistic support operator surface without pretending that backend ticket persistence exists yet.

The first support operator is the admin user. That means the page can assume admin-only access and self-assignment semantics, while still shaping the UI and data model so a future support API can replace the seeded state.

The async v0 demo at https://v0.app/chat/uDq7N8Mmc0w is useful as a visual reference for a dense support dashboard: queue, SLA badges, ticket detail, context, attachments, and chat. Implementation should follow this repository's React/Vite module patterns rather than copying the generated Next.js structure.

## Goals / Non-Goals

**Goals:**

- Add an admin-only page for managing support tickets under the existing app shell.
- Make support easy to operate: queue first, selected ticket detail, message composer, status/priority controls, and clear context.
- Represent user-submitted evidence, including screenshot previews and screen/route context, without exposing raw metadata as the main UI.
- Keep the page deterministic, testable, and frontend-local until support persistence exists.
- Use existing shared UI primitives, sidebar patterns, route guards, and testing conventions.

**Non-Goals:**

- Do not add a backend support-ticket API, database tables, realtime transport, notifications, file upload storage, or generated API client changes.
- Do not connect the floating widget and admin page through cross-tab or cross-route persisted data in this phase.
- Do not implement multi-agent assignment, escalation queues, audit logs, or SLA configuration beyond the seeded local model.
- Do not replace the existing user-facing help widget support flow.

## Decisions

1. **Create a new support module for admin ticket management.**
   - Implement the page under a support-focused module such as `apps/web/src/modules/support`, with `pages`, `ui`, and `model` boundaries.
   - Rationale: the admin page is not part of the user-facing floating widget UI, but it belongs to the same product domain. A separate module avoids overloading `modules/help` with admin-only workflow code.
   - Alternative considered: place the page inside `modules/help`. That keeps all support-like code together, but it mixes requester UX and operator UX in one module and makes future API boundaries less clear.

2. **Expose the page at `/admin/chamados` and add it to admin navigation.**
   - Compose the route through the existing protected app route and admin-only guard, matching the current `/admin/usuarios` pattern.
   - Add a sidebar item in the "Administracao" group with a support-oriented icon and active-state handling.
   - Rationale: admins already have an admin namespace; support tickets are an administrative workflow, not a regular member workspace page.
   - Alternative considered: `/app/suporte`. That would make support feel generally available, but this first phase is explicitly admin-operated.

3. **Use seeded local tickets with a future-proof model shape.**
   - Define frontend types for ticket status, priority, assignee, requester, source context, attachments, messages, timestamps, and SLA state.
   - Seed a few tickets that mirror the widget domain: protocol, user question, screenshot attachment, screen label, route, process/document context, and prior messages.
   - Rationale: this enables a polished, testable page now while preserving an obvious replacement point for a future API adapter.
   - Alternative considered: share runtime state directly with the floating widget. That would still not persist across sessions and would make testing harder without solving the real backend gap.

4. **Use a queue-detail workspace rather than a table-only page.**
   - The main surface should combine summary metrics, filters/search, a ticket queue, and a selected ticket detail panel with chat and context.
   - On desktop, prioritize a two-pane or three-pane operational layout. On narrower viewports, collapse into a stacked layout where selecting a ticket brings the detail into focus.
   - Rationale: support work depends on quick triage and immediate reply, so forcing the admin through table rows and separate pages would slow the workflow.
   - Alternative considered: a paginated table with a modal detail. That fits user management, but support conversations need persistent context and composer visibility.

5. **Make local actions deterministic and explicit.**
   - Local actions should include assigning to the current admin, changing priority, moving status, sending a reply, resolving, and reopening.
   - Status changes should update visible labels, queue grouping, and latest activity in memory.
   - Rationale: this gives the user a credible management experience immediately and establishes behavior tests before API integration.
   - Alternative considered: render read-only seeded tickets. That would validate visual layout but would not satisfy "gerenciar os chamados".

6. **Test at model, UI, route, and browser levels.**
   - Model tests cover filtering, stats, status transitions, reply creation, and selected-ticket updates.
   - Component tests cover rendering, filters, actions, composer behavior, and empty states.
   - Router/sidebar tests cover admin-only access and navigation.
   - A focused E2E test covers an admin opening `/admin/chamados`, filtering/selecting a ticket, replying, and resolving it.

## Risks / Trade-offs

- **Frontend-local tickets can look more integrated than they are** -> Keep copy and code boundaries clear that this is deterministic local data until a backend support contract is added.
- **A dense support dashboard can become visually noisy** -> Default to the most urgent/open ticket selected, keep filters compact, and use restrained badges instead of large decorative cards.
- **Admin-only route could drift from existing admin navigation patterns** -> Reuse the current `/admin/usuarios` route/guard/sidebar approach and add focused router tests.
- **Future API integration may require model changes** -> Keep state helpers and mock records in a model layer shaped like an eventual API response.

## Migration Plan

- Add the page and route behind the existing admin guard.
- Add the sidebar link for admin sessions only.
- Ship with seeded deterministic tickets and no backend calls.
- Rollback is limited to removing the route, sidebar link, and new module files.

## Open Questions

- What status taxonomy should the persisted support API eventually use?
- Should support tickets belong globally to LicitaDoc admins or be scoped by organization in a later phase?
- Should screenshots be stored as files, signed URLs, or transient browser captures when backend support is added?
