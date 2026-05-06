## Why

The process detail page still does not fully match the validated document-card overflow action, because the `Duplicar` item renders as a disabled placeholder while the approved UI presents it as a normal action. That mismatch makes the copy-style buttons feel inconsistent and leaves the remaining parity gap visible even after the icon was restored.

## What Changes

- Align the `Duplicar` overflow action on process-detail document cards with the validated enabled menu-item presentation.
- Define the interim user-visible behavior for `Duplicar` so the action can be presented consistently before a full document duplication workflow exists.
- Preserve the existing document card layout, status badges, links, and process-detail data flow while narrowing the change to the duplicate action state and feedback.
- Add focused tests for the duplicate action presentation and the selected interim interaction.

## Capabilities

### New Capabilities
- `web-process-detail-duplicate-action-parity`: Defines the enabled presentation and interim user feedback for the `Duplicar` action in process-detail document card overflow menus.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/modules/processes/ui/process-detail-page.tsx`, related process-detail tests, and likely the local toast usage for user feedback.
- APIs: none.
- Database: none.
- Systems: authenticated web app process detail route at `/app/processo/:processId`.