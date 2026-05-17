## Context

The admin support inbox at `/admin/chamados` currently asks the support ticket API for the active queue filters, including `status`. The UI then calculates the status tabs and attention badge from the returned `items`. When the operator selects "Resolvidos", the list is correctly filtered to resolved tickets, but the metrics also collapse to that filtered result. That produces misleading numbers such as "Abertos 0" and "Resolvidos 3" even when the full queue contains active tickets.

The support queue is now backed by API data and realtime cache updates, so fixing this only in the visible React list would be fragile. The metric source needs to represent the queue scope independently from the currently selected status tab.

## Goals / Non-Goals

**Goals:**

- Keep the selected status tab as a filter for the visible queue.
- Make status counts represent the current queue scope without being narrowed by the selected status tab.
- Keep search, priority, assignee, source, authorization visibility, and requester/admin scope reflected in the metric base.
- Keep the inbox compact and avoid introducing dashboard-style KPI cards.
- Preserve support ticket detail selection, mutations, realtime updates, and existing list pagination behavior.
- Add regression coverage for the exact bug seen in the UI.

**Non-Goals:**

- Do not redesign the support inbox layout.
- Do not change the support ticket status taxonomy.
- Do not add database columns, new dependencies, or a separate analytics service.
- Do not change help-widget requester flows except through additive shared list response typing if needed.

## Decisions

1. **Expose queue metrics as API facets instead of deriving them from the visible page only.**
   - Add an additive `counts` object to the support ticket list response.
   - `counts` should include `all`, `open`, `waiting`, `resolved`, and `attention`.
   - The visible `items`, `total`, and pagination continue to honor every active filter, including `status`.
   - The `counts` object uses the same visibility and non-status filters, but intentionally ignores the selected `status` filter.
   - Alternative considered: run a second frontend query with `status: "all"` and calculate counts in the browser. That is simpler, but it breaks when there are more tickets than the page size and makes the frontend responsible for API-level queue semantics.

2. **Centralize count calculation near `getSupportTickets`.**
   - Reuse the existing filter builder, but let it build two filter sets:
     - list filters: all filters, including selected status
     - metric filters: same filters without selected status
   - Count each status from the metric filter set in the database.
   - Calculate `attention` from the same metric scope and existing SLA semantics, excluding resolved tickets through `getTicketSlaState` equivalence or SQL date comparison.
   - Alternative considered: count only the already-loaded ticket rows. That preserves current behavior but is the root cause of the bug.

3. **Use response counts for the status tabs and attention badge.**
   - The admin page should prefer `ticketsQuery.data.counts` when available.
   - Existing local `getSupportTicketStats` can remain for seeded data, tests, or fallback behavior, but it should not be the primary source for API-backed status tabs.
   - The "Fila de atendimento" subtitle should show visible tickets versus the scoped total in a way that matches the selected filters.
   - Alternative considered: remove the subtitle total. That hides the inconsistency but does not solve the operator need.

4. **Keep cache updates accurate by refetching list queries after ticket state changes.**
   - Mutations and realtime events can still update selected-ticket detail optimistically.
   - Any status, priority, assignee, read, or message event that can change counts should invalidate/refetch support ticket list queries so `counts` stay authoritative.
   - Alternative considered: recompute counts inside every cached list. That is error-prone because each cached list may be filtered and paginated.

5. **Keep the UI language polished but scoped.**
   - Fix affected labels according to the app's Portuguese copy policy.
   - Avoid widening the sidebar or adding large cards just to fit the labels; compact tabs can use wrapping or responsive text treatment.

## Risks / Trade-offs

- **Additional count queries may add backend work** -> Keep the count queries narrow, indexed by existing ticket status/context fields, and scoped to the same list endpoint request.
- **Attention count can drift if implemented differently from UI SLA logic** -> Share the same time basis and status exclusion semantics in tests.
- **List invalidation can add extra network requests after realtime events** -> Prefer correctness for operator metrics; the queue is operational and the query is already bounded by page size.
- **Additive API response changes require client regeneration** -> Regenerate `@licitadoc/api-client` and update MSW fixtures in the same change.

## Migration Plan

- Extend the list response schema and `getSupportTickets` return value with `counts`.
- Regenerate API client types.
- Update web support API/model types and MSW fixtures.
- Switch the admin inbox status tabs and attention badge to use response counts.
- Add regression tests for selecting a status tab while other status counts remain visible.
- Rollback is limited to removing the additive `counts` response field usage and returning the admin page to local stats, though that would reintroduce the bug.

## Open Questions

- Should `attention` eventually become a persisted or configurable SLA metric instead of being derived from first response due time?
- Should requester-facing `/api/support-tickets/me` expose the same `counts` field now for type consistency, even if the widget does not display queue metrics?
