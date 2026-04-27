## Context

The process detail page was recently migrated from `tmp/processo.tsx` into `apps/web/src/modules/processes/ui/process-detail-page.tsx`. That migration preserved the document-card layout, but the status badge icon map diverged from the validated reference: the current page uses generic action and document icons (`ClipboardList`, `Pencil`, `Plus`) where the reference used status-specific icons (`CheckCircle2`, `Clock`, `AlertTriangle`). The document overflow menu also regressed from a copy-icon menu item to a text-only `Duplicar` entry.

The affected surface is local to the authenticated process detail page. There is no backend or API dependency, and the change only needs to restore the approved visual semantics without redesigning the rest of the page.

## Goals / Non-Goals

**Goals:**

- Restore the approved status-badge icons for process-detail document cards.
- Restore the copy icon in the `Duplicar` overflow action.
- Keep the current process detail data flow, routes, and action targets unchanged.
- Add focused tests that make future iconography regressions visible.

**Non-Goals:**

- Introduce a new document duplication workflow or backend endpoint.
- Redesign card layout, spacing, typography, or document actions beyond the mismatched icons.
- Change shared badge, dropdown, or button primitives globally.

## Decisions

### Decision: Scope the fix to the process detail module

This issue is specific to the process detail page migration, so the fix should stay inside the processes module instead of modifying shared UI primitives. The mismatch comes from page-level icon choices, not from the shared `Badge` or `DropdownMenu` components.

Alternatives considered:

- Change shared badge or menu primitives to inject icons automatically: too broad for a local parity issue and risks altering unrelated screens.
- Leave the current page-specific mapping in place and only tweak classes: insufficient because the icon semantics are the actual regression.

### Decision: Centralize document status badge metadata near the process model helpers

The page already reads badge label and class names through `getProcessDetailDocumentStatusConfig(...)`, but it keeps the badge icon map in a separate local constant. Extending the detail status metadata to include the icon, or otherwise colocating the icon choice with the existing status config, keeps the status badge contract in one place and makes visual regressions easier to test.

Alternatives considered:

- Keep the icon mapping as an unrelated local constant in the page: simpler in the moment, but it repeats status metadata and makes future drift more likely.
- Move all visual metadata into shared UI primitives: unnecessary abstraction for a process-specific status vocabulary.

### Decision: Restore the copy icon without expanding duplication scope

The overflow action should render the `Duplicar` menu item with the approved copy icon and retain the current interaction behavior already supported by the page. This keeps the change aligned with the user-facing regression instead of silently introducing new duplication behavior.

Alternatives considered:

- Implement a real duplication action as part of this fix: outside the reported issue and likely requires new routing or backend behavior.
- Leave the item text-only and document the mismatch: does not solve the visual parity problem.

## Risks / Trade-offs

- [Centralizing icon metadata in helpers can slightly increase coupling between model helpers and UI icons] -> Keep the exported shape narrow and limited to the process detail status vocabulary.
- [Tests can become too implementation-specific if they only assert icon component names] -> Prefer assertions based on accessible text plus stable icon markers or rendered menu content close to the user-visible behavior.
- [The duplicate action state could be misread as a functional request] -> Keep the design and tasks explicit that this change restores presentation, not a new duplication workflow.

## Migration Plan

1. Update the process detail status metadata and page rendering so each document badge uses the approved icon.
2. Restore the copy icon inside the `Duplicar` overflow menu item while preserving the current action behavior.
3. Add focused tests for badge icon rendering and duplicate menu presentation.
4. Run the relevant web unit tests for the process detail page.

Rollback:

- Revert the process-detail UI and test changes. No API, database, or dependency rollback is required.

## Open Questions

None.