## Context

The process detail page already restored the copy icon for the `Duplicar` overflow action, but the action still renders as a disabled menu item while the validated reference shows it as a normal interactive option. The result is a visible parity gap on every document card: the button looks unfinished even though the rest of the overflow affordance matches the approved layout.

There is still no dedicated document duplication route or backend workflow in the current system. The web app already includes a mounted `sonner` toaster and existing product pages use it for user feedback, so the remaining mismatch can be closed locally without inventing backend behavior.

## Goals / Non-Goals

**Goals:**

- Restore the enabled visual treatment of the `Duplicar` overflow action on process-detail document cards.
- Replace the disabled placeholder with an explicit interim interaction that tells the user duplication is not available yet.
- Keep the change local to the process detail page and preserve all existing edit/view/create routes.
- Add focused tests for the enabled menu item and toast feedback.

**Non-Goals:**

- Implement a real document duplication workflow, route, or API.
- Change process-detail card layout, badge styling, or other document actions.
- Introduce a new toast library or global clipboard abstraction.

## Decisions

### Decision: Use the existing `sonner` toast for interim duplicate feedback

The `Duplicar` menu item should be rendered as an enabled action and, when selected, should show a concise toast explaining that duplication will be available in a future step. This preserves the approved visual treatment while giving users an explicit and reversible response instead of a silent disabled control.

Alternatives considered:

- Keep the action disabled: preserves the current mismatch and offers no feedback.
- Hide the action entirely until duplication exists: diverges further from the validated reference layout.
- Build a real duplication flow now: outside the reported issue and larger than a parity fix.

### Decision: Keep the duplicate interaction local to the process detail page

The duplicate action should be implemented inside the process detail module because the current mismatch only exists there and the interaction is still a temporary UI-level affordance. No shared dropdown abstraction or document module contract is needed yet.

Alternatives considered:

- Add a shared duplicate-action helper across modules: too broad for a single known surface.
- Add an API contract now for future duplication: premature before product behavior is defined.

### Decision: Cover both action state and feedback in the focused page test

The process-detail page test should assert that the overflow item is no longer disabled and that activating it produces the selected feedback message. This keeps the regression coverage tied to user-visible behavior rather than only DOM structure.

Alternatives considered:

- Only assert the menu item exists: too weak because it would miss a return to the disabled state.
- Only assert toast text from a helper unit test: would not prove the actual dropdown interaction works.

## Risks / Trade-offs

- [Users may interpret an enabled duplicate action as fully implemented] -> Show immediate toast feedback that clearly states duplication is not available yet.
- [Temporary toast copy can become stale once real duplication exists] -> Keep the messaging explicit that this is an interim behavior and isolate it to the local action handler.
- [Dropdown interaction tests can be timing-sensitive] -> Reuse the existing focused process-detail page test style and assert the toast after opening the Radix menu through user-visible interaction.

## Migration Plan

1. Update the process-detail overflow menu so `Duplicar` is rendered as an enabled item.
2. Add a local click handler that shows the interim duplication toast.
3. Extend the process-detail page test to cover the enabled action and toast feedback.
4. Run the focused process-detail page tests.

Rollback:

- Revert the local process-detail UI and test changes. No API, database, or dependency rollback is required.

## Open Questions

None.