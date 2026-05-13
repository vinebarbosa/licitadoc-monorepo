## Why

The authenticated process creation page is still a placeholder while the public demo page already represents the validated product UI for creating a process. We need the production `/app/processo/novo` experience to reuse that validated flow and submit the canonical process API payload instead of drifting into a separate implementation.

## What Changes

- Replace the authenticated process create placeholder with the validated demo creation UI from `apps/web/src/modules/public/pages/process-create-demo-page.tsx`.
- Keep the demo page as the visual and interaction source of truth; only adapt it where production data, routing, auth scope, and API submission require it.
- Connect the page to real organization, department, user, and process-create API adapters.
- Submit the canonical API payload with `procurementMethod`, `biddingModality`, `processNumber`, `externalId`, `issuedAt`, `responsibleUserId`, `title`, `object`, `justification`, `organizationId`, `departmentIds`, and structured `items`.
- Remove demo-only sample data from the authenticated page.
- Preserve the existing route, success navigation to created process detail, and error feedback.

## Capabilities

### New Capabilities
- `web-process-create-flow`: Authenticated process creation UI and API behavior for the validated demo-aligned process creation flow.

### Modified Capabilities
- `web-frontend-architecture`: Reinforces that module pages should consume generated API contracts through module adapters while reusing validated product UI.

## Impact

- `apps/web/src/modules/processes/pages/process-create-page.tsx`
- `apps/web/src/modules/processes/api/processes.ts`
- `apps/web/src/modules/processes/model/processes.ts`
- `apps/web/src/modules/processes/pages/process-create-page.test.tsx`
- Generated process API types from `@licitadoc/api-client`
