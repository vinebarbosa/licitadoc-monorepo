## 1. Table Layout

- [ ] 1.1 Update the processes listing table to use fixed layout and explicit widths for stable columns.
- [ ] 1.2 Constrain the process name column so long names render on one line with overflow ellipsis.
- [ ] 1.3 Confirm loading skeleton column sizing stays aligned with the loaded table.

## 2. Tooltip Behavior

- [ ] 2.1 Wrap process name links with the shared tooltip primitive while preserving link navigation semantics.
- [ ] 2.2 Render the complete process display name in tooltip content with a bounded readable width.

## 3. Verification

- [ ] 3.1 Add or update process page tests for long-name truncation classes and tooltip content.
- [ ] 3.2 Run the focused web test command for the processes page.
- [ ] 3.3 Visually verify `/app/processos` with a long process name so the table no longer grows horizontally.
