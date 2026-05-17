## Why

The admin support queue status card is showing misleading counts because the same status-filtered ticket list is used both to render the visible queue and to calculate the "Todos", "Abertos", "Aguardando", and "Resolvidos" totals. This makes operators lose confidence in the triage surface exactly where they need a quick, accurate read of the support workload.

## What Changes

- Make the queue status counts independent from the currently selected status tab, while preserving the selected tab as a filter for the visible ticket list.
- Keep non-status filters such as search, priority, assignee, and source reflected in the counts when they are part of the current queue scope.
- Ensure the "Fila de atendimento" summary distinguishes visible tickets from the total tickets in the current filtered scope.
- Preserve the current compact inbox UI, selected-ticket behavior, realtime cache updates, and support actions.
- Fix Portuguese labels in the affected queue metrics area according to the app's accent policy.
- Add regression coverage for status count behavior so selecting a tab does not zero out or collapse the other tab counts.

## Capabilities

### New Capabilities
- `web-admin-support-queue-metrics`: Defines how the admin support inbox reports status totals and attention counts while the queue is filtered.

### Modified Capabilities
- None.

## Impact

- Affected frontend code:
  - `apps/web/src/modules/support/ui/admin-support-tickets-page.tsx`
  - `apps/web/src/modules/support/api/support-tickets.ts`
  - `apps/web/src/modules/support/model/support-tickets.ts`
  - support page tests under `apps/web/src/modules/support/pages/`
- Potential API follow-up:
  - The existing support ticket list endpoint may need status facet/count support if the frontend cannot reliably derive counts from a status-filtered page.
  - If the API contract changes, regenerate `@licitadoc/api-client`.
- No database migration or new dependency is expected.
