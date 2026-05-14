## Why

The protected process detail route is currently not implemented, while the product already has a validated detail UI in the public demo. Users need the real `/app/processo/:processId` page to show API-backed process information, institutional context, items, and required document actions without relying on mock data.

## What Changes

- Implement the process detail page using `apps/web/src/modules/public/pages/process-detail-demo-page.tsx` as the visual reference.
- Load detail data from `GET /api/processes/:processId` and render loading, retryable error, and not-found states.
- Render process header, executive summary, process information, solicitation items, institutional context, control dates, and document cards from API data.
- Link document actions to the current document creation, edit, and preview routes.
- Extend the process detail API contract where needed so the page can render organization context and stable display values.
- Add focused API and web tests covering the detail contract and UI behavior.

## Capabilities

### New Capabilities
- `web-process-detail-page`: Protected API-backed process detail page that adopts the validated product UI.

### Modified Capabilities
- `process-management`: Process detail reads expose display-ready organization context, native items, summary values, and document card data required by the detail page.

## Impact

- `apps/web/src/modules/processes/ui/process-detail-page.tsx`
- `apps/web/src/modules/processes/model/processes.ts`
- `apps/web/src/modules/processes/api/processes.ts`
- `apps/web/src/modules/processes/pages/process-detail-page.test.tsx`
- `apps/web/src/app/router.test.tsx`
- `apps/web/src/test/msw/fixtures.ts`
- `apps/api/src/modules/processes/get-process.ts`
- `apps/api/src/modules/processes/processes.shared.ts`
- `apps/api/src/modules/processes/processes.schemas.ts`
- `apps/api/src/modules/processes/processes.test.ts`
- API client generation if the OpenAPI detail response changes
