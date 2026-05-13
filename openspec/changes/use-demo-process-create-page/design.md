## Context

`apps/web/src/modules/public/pages/process-create-demo-page.tsx` contains the validated process creation UI, including the four-step flow, form layout, item/kit editing, validation shape, and review experience. The authenticated route at `/app/processo/novo` is the production destination and must use real authenticated reference data and the generated process-create API contract.

The API is moving to the canonical process payload with structured items and responsible users. The authenticated page must therefore adapt the demo field names to `@licitadoc/api-client` request types while preserving the demo UI and avoiding a second hand-designed flow.

## Goals / Non-Goals

**Goals:**

- Use the demo page as the production UI source for `ProcessCreatePage`.
- Replace sample organizations, users, and departments with API-backed data.
- Submit the canonical process create payload through the existing process module API adapter.
- Preserve demo item behavior for simple items, kit items, and kit components.
- Keep the authenticated page inside the `processes` module and route to the created process detail on success.

**Non-Goals:**

- Redesign the process creation UI.
- Change the public demo page behavior.
- Add new backend endpoints beyond consuming the existing process, organization, department, and user contracts.
- Implement process editing or post-create document generation in this change.

## Decisions

- Treat the demo page as the visual source of truth and copy/adapt its component structure into the authenticated page instead of designing a new wizard.
- Keep production data access behind `apps/web/src/modules/processes/api/processes.ts`, including reference data queries for organizations, departments, users, and process creation.
- Map demo fields to canonical API names at submission time: `formaContratacao` to `procurementMethod`, `modalidade` to `biddingModality`, `responsibleId` to `responsibleUserId`, and item arrays to structured `items`.
- Filter selectable departments and responsible users by the resolved organization in the UI so users are guided toward valid API submissions.
- Use existing shared UI primitives from `@/shared/ui` and lucide icons already used by the demo page.

## Risks / Trade-offs

- Demo field names differ from the canonical API payload -> keep a small explicit mapper near submit logic.
- Generated client types may still be changing while the API contract settles -> rely on module-level adapters and run web typecheck after integration.
- The current process tests were written around the placeholder/legacy form -> update tests to assert the demo-aligned wizard and canonical payload.
- The authenticated page may need more reference data than the old page -> keep loading and empty states clear and local to the page.
