## Why

The admin support inbox currently mixes relative times, SLA hints, and message timestamps across the queue and chat without a clear hierarchy. Admins need to scan conversation freshness quickly, then read exact chat timing only when it helps answer the ticket.

## What Changes

- Standardize how time is displayed in the admin support panel.
- Make queue/conversation tabs emphasize last activity and SLA urgency without visual clutter.
- Make chat messages show clear, consistent timestamps that do not compete with message content.
- Preserve the existing support ticket data model and realtime behavior.
- Add regression coverage for the time formatting and admin inbox rendering.

## Capabilities

### New Capabilities
- `admin-support-time-display`: Defines how the admin support inbox presents relative and exact time information in conversation lists, status tabs, chat messages, and SLA context.

### Modified Capabilities
- None.

## Impact

- Affects the web admin support inbox UI and support ticket time-formatting helpers.
- Affects support inbox tests and model/helper tests.
- No API, database, realtime provider, or generated API client changes expected.
