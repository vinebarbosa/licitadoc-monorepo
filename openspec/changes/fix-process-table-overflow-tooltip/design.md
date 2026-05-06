## Context

The processes listing page renders a shared table inside a card. The shared `TableCell` uses `whitespace-nowrap`, so a long process name can force the table to exceed the visible content area and create a horizontal scrollbar. The web package already includes a shared Radix-based tooltip primitive at `apps/web/src/shared/ui/tooltip.tsx`.

## Goals / Non-Goals

**Goals:**

- Keep the processes table within its available page content width.
- Make the process name column truncate long values with an ellipsis.
- Let users read the complete process name through the existing shared tooltip behavior.
- Preserve the clickable link to the process detail page.
- Cover the behavior with a focused component test.

**Non-Goals:**

- Change process API contracts, backend data, or generated clients.
- Redesign the listing, change visible columns, or replace the table component.
- Add a new tooltip dependency.
- Apply truncation globally to every shared table in the application.

## Decisions

### Decision: Scope the layout fix to the processes listing table

The change should update the processes listing table instance rather than the shared table primitive. The issue is visible in the process name column, and a global table change could alter unrelated admin or future tables.

Alternatives considered:

- Change `Table` globally to always use `table-fixed`: simpler, but likely to affect tables that rely on content-sized columns.
- Add a new shared table variant: useful later, but more abstraction than this narrow fix needs.

### Decision: Use fixed table layout and explicit column widths

The process table should opt into `table-fixed` and assign predictable widths to the stable columns. The name column can then consume the remaining space without expanding the whole table. The link inside the name cell should use `block`, `min-w-0`, `overflow-hidden`, `text-ellipsis`, and `whitespace-nowrap`.

Alternatives considered:

- Only add `truncate` to the link: insufficient when the table algorithm still expands to fit content.
- Keep horizontal scrolling and add tooltip only: preserves the current problem and makes scanning harder.

### Decision: Use the existing shared Tooltip primitive around the process name link

The full process name should be available through `Tooltip`, `TooltipTrigger`, and `TooltipContent` from `@/shared/ui/tooltip`. The trigger should use `asChild` so the existing link remains the interactive element and keeps navigation semantics.

Alternatives considered:

- Native `title` attribute: simple, but inconsistent timing/styling and limited accessibility/testing control.
- Custom CSS-only tooltip: duplicates an existing primitive and can introduce focus/positioning issues.

## Risks / Trade-offs

- [Column widths may need small visual tuning across desktop sizes] -> Keep widths conservative and verify the row remains readable at the current content max width.
- [Tooltip content can become too wide for very long names] -> Apply a max width and allow normal wrapping in tooltip content.
- [Testing tooltip delay can be timing-sensitive] -> Prefer asserting the tooltip content through user-event hover with fake timers or the testing approach already used for Radix components in the repo.

## Migration Plan

1. Update the processes listing table markup and name cell classes.
2. Wrap process display names with the shared tooltip while preserving the link target.
3. Add or update process page tests for long-name truncation classes and tooltip content.
4. Run the focused web tests for the processes page.

Rollback:

- Revert the scoped processes listing page changes. No API, database, or dependency rollback is required.

## Open Questions

None.
