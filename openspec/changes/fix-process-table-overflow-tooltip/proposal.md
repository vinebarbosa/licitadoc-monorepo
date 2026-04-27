## Why

Long process names currently force the processes table to expand horizontally, making the listing harder to scan and pushing other columns out of view. The table should keep a stable layout while still letting users inspect the full column value when needed.

## What Changes

- Constrain the process listing table so long text values do not make the table wider than its available container.
- Truncate the process name column with CSS ellipsis when the value exceeds the available column width.
- Show the full process name in a hover tooltip after the normal tooltip delay.
- Preserve the existing row navigation, filters, pagination, loading, empty, and error states.
- Add focused coverage for the truncated-name behavior and tooltip accessibility.

## Capabilities

### New Capabilities
- `web-process-table-readability`: Defines stable column sizing, ellipsis truncation, and delayed tooltip access for long process table values in the web processes listing.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/modules/processes/ui/processes-listing-page.tsx`, process page tests, and possibly shared tooltip/table primitives if the existing shared UI boundary already exposes the needed primitive.
- APIs: none.
- Database: none.
- Systems: authenticated web app process listing at `/app/processos`.
