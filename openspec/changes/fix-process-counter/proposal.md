## Why

The Processos badge in the app sidebar currently displays a hardcoded `5`, which makes the workspace navigation misleading whenever the real number of visible processes differs. The sidebar should reflect the same actor-scoped process count returned by the existing process listing contract.

## What Changes

- Replace the hardcoded Processos sidebar badge with a value derived from the API-backed process listing total.
- Keep the badge scoped to the authenticated actor's process visibility, matching the existing `/api/processes` listing behavior.
- Avoid showing stale mock data in loading, error, or empty states.
- Add focused frontend coverage so the sidebar cannot regress to a fixed literal count.

## Capabilities

### New Capabilities
- `web-app-shell-process-counter`: Defines how the app shell shows the Processos navigation count from live process listing data.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/modules/app-shell/components/app-sidebar.tsx` and its tests.
- Data source: existing process listing hook/client backed by `GET /api/processes`.
- No backend schema, route, database, or generated API-client changes are expected.
