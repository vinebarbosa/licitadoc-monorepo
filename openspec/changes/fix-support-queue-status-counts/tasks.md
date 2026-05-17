## 1. API Queue Metrics

- [x] 1.1 Add a support ticket queue counts schema with `all`, `open`, `waiting`, `resolved`, and `attention` fields.
- [x] 1.2 Extend the support ticket list responses to include additive `counts` data without changing existing `items`, `total`, or pagination fields.
- [x] 1.3 Refactor support ticket filter construction so list queries can include `status` while metrics queries reuse the same scope without `status`.
- [x] 1.4 Implement status count queries for the metric scope, respecting actor visibility, requester/admin scope, search, priority, source, and assignee filters.
- [x] 1.5 Implement the `attention` count from the same metric scope while excluding resolved tickets and matching current SLA semantics.
- [x] 1.6 Add API tests proving status-filtered list responses still return full scoped counts across all statuses.

## 2. API Client and Cache Behavior

- [x] 2.1 Regenerate the API client after the support ticket response schema changes.
- [x] 2.2 Update support ticket frontend API types and helpers to expose response `counts`.
- [x] 2.3 Update support ticket list cache handling so mutations and realtime ticket events refresh list queries when counts can change.
- [x] 2.4 Preserve selected-ticket detail cache updates so the conversation still feels immediate after status, priority, assignment, message, read, or realtime events.

## 3. Admin Inbox UI

- [x] 3.1 Update the admin support status tabs to use API-provided counts instead of stats derived from the visible `items` page.
- [x] 3.2 Keep the selected status tab filtering the visible queue while other tab counts remain visible and accurate.
- [x] 3.3 Update the queue subtitle to distinguish visible ticket count from the scoped queue total.
- [x] 3.4 Update the attention badge to use scoped response counts and avoid counting only the active status tab.
- [x] 3.5 Polish affected Portuguese labels and responsive tab text so "Aguardando" and the attention badge remain readable in the current queue width.

## 4. Fixtures and Web Tests

- [x] 4.1 Update MSW support ticket list fixtures and handlers to include scoped `counts` in list responses.
- [x] 4.2 Add or update admin support inbox tests covering initial counts, selecting "Resolvidos", selecting "Abertos", and non-status filters.
- [x] 4.3 Add regression coverage for a status tab with zero visible rows while other status tabs still show non-zero scoped counts.
- [x] 4.4 Update existing support API tests that assert list response shape.

## 5. Verification

- [x] 5.1 Run focused API support ticket tests and API typecheck.
- [x] 5.2 Run API client generation/typecheck.
- [x] 5.3 Run focused web support tests and web typecheck.
- [ ] 5.4 Verify the admin support inbox in the browser, especially the card shown in the screenshot: all counts, active tab behavior, attention badge, and label readability.
