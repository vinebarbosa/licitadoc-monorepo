## Why

The current "Continuar de onde parei" area reads as document-level work, but the user's real mental model is usually the contracting process they were advancing. Showing recent contracting processes there makes the home page more useful as a resume-work surface and lets the existing document summary communicate progress clearly.

## What Changes

- Replace the local mocked in-progress document cards in "Continuar de onde parei" with recent contracting process cards sourced from the process listing data available to the authenticated user.
- Calculate each card progress from generated documents: `dfd`, `etp`, `tr`, and `minuta` each contribute 25%, so `completedCount / 4` maps to 0%, 25%, 50%, 75%, or 100%.
- Keep the section focused on the latest processes the user was working on, using the operational activity timestamp exposed by process listings rather than process creation date.
- Show process identity, concise object/name, generated document status, latest activity, and a continuation action that opens the process detail.
- Update loading, empty, and error behavior so the section does not show stale mock cards when process data is unavailable.

## Capabilities

### New Capabilities
- `web-app-home-page`: Defines the authenticated Central de Trabalho home page behavior, including process-based work resumption cards and process listing integration.

### Modified Capabilities
- `process-management`: Ensure process listings can support recent-work surfaces by ordering or exposing process activity based on process/document updates.

## Impact

- Affected code: `apps/web/src/modules/app-shell/pages/app-home-page.tsx`, its tests, and possibly shared fixtures/MSW data used by the home page.
- APIs: no new endpoint is expected; `GET /api/processes` may need ordering behavior adjusted so recent-work cards are based on the activity timestamp already derived from process/document updates.
- Dependencies: no new dependency expected.
- Systems: authenticated `/app` home page, process navigation, process listing adapter, and user resume-work experience.
