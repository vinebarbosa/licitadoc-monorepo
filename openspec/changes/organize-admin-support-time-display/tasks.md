## 1. Time Formatting Helpers

- [x] 1.1 Audit current support time displays in `support-tickets.ts` and `admin-support-tickets-page.tsx`.
- [x] 1.2 Add or refactor centralized helpers for queue freshness, exact chat time, day grouping labels, and accessible exact timestamps.
- [x] 1.3 Keep helpers deterministic by accepting an optional reference timestamp for tests.
- [x] 1.4 Add model/helper tests for same-minute, same-day, previous-day, older, and invalid/missing timestamp cases.

## 2. Admin Queue and Conversation Tabs

- [x] 2.1 Update ticket queue rows to use the new queue freshness display with exact time available through title or accessible label.
- [x] 2.2 Ensure status/conversation tabs preserve counts and labels while keeping time/SLA indicators visually separate.
- [x] 2.3 Keep queue rows compact on the current admin inbox width without pushing out protocol, requester, subject, unread, attachment, status, or priority indicators.

## 3. Chat Timeline

- [x] 3.1 Update chat bubbles to use concise exact message times instead of generic relative labels.
- [x] 3.2 Add day separators or equivalent day labels when the selected conversation spans multiple local days.
- [x] 3.3 Keep system message time treatment visually secondary and distinct from user/support replies.
- [x] 3.4 Ensure realtime-added messages use the same chat time and day grouping rules.

## 4. Verification

- [x] 4.1 Update admin support inbox tests for queue time labels, chat message times, and day grouping.
- [x] 4.2 Run focused support model and admin support page tests.
- [x] 4.3 Run web typecheck.
- [ ] 4.4 Verify `/admin/chamados` in the browser when an authenticated admin session is available, checking queue rows, status tabs, chat messages, and date grouping.
