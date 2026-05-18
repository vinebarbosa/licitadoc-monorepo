## Why

Printed/PDF previews still inherit automatic screen pagination boundaries, so a whole topic can be forced to the next physical page and leave the previous page mostly blank. This is visible in the attached PDF where one page contains only a short paragraph while the next topic starts after a large empty area.

## What Changes

- Separate automatic screen pagination from print pagination.
- Keep automatic pagination boundaries for the interactive preview sheet layout on screen.
- Do not let automatic, measurement-derived boundaries force `break-before: page` or equivalent page breaks in print/PDF output.
- Preserve explicit/manual page breaks in print/PDF output.
- Keep print spacing resets from the prior fix so hidden screen spacers do not leak into printed pages.
- Add regression coverage and browser/PDF verification for automatic boundaries, manual boundaries, and the blank-page scenario.

## Capabilities

### New Capabilities

- `document-preview-print-flow`: Defines how document preview pagination boundaries map to browser print/PDF output, including the distinction between automatic screen boundaries and manual page breaks.

### Modified Capabilities

- None.

## Impact

- Frontend document preview pagination CSS and dynamic print styles.
- Document pagination surface tests around generated boundary CSS.
- Document preview regression tests for print behavior.
- Browser/PDF verification against the running web app on `localhost:5173`.
