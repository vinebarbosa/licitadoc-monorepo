## Why

The migrated process detail page no longer matches the validated UI for document status badges and the overflow copy action. The current iconography weakens status recognition and the `Duplicar` control no longer looks like the approved interaction, so the page needs a narrow parity fix before more detail-page polish diverges further.

## What Changes

- Restore the approved icon mapping for process-detail document status badges so each status communicates the same visual meaning as the validated reference layout.
- Restore the copy icon and matching menu-item presentation for the `Duplicar` action in each document card overflow menu.
- Preserve the current process detail route, data loading, document links, and loading/error states while adjusting only the mismatched visual controls.
- Add focused test coverage for the badge icon mapping and the duplicate action presentation.

## Capabilities

### New Capabilities
- `web-process-detail-visual-parity`: Defines the validated badge iconography and duplicate-action presentation for document cards on the authenticated web process detail page.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/modules/processes/ui/process-detail-page.tsx`, related process-detail tests, and any nearby helper extraction used to centralize icon metadata.
- APIs: none.
- Database: none.
- Systems: authenticated web app process detail route at `/app/processo/:processId`.