## 1. Stepper Model

- [x] 1.1 Define a richer ordered list of product-facing generation stages for the planning card.
- [x] 1.2 Add frontend logic to derive the active step from existing planning content, live document content, and generation status.
- [x] 1.3 Ensure the derived stages do not display raw planning/reasoning content.

## 2. Stepper UI

- [x] 2.1 Replace the simple planning phase grid with a compact vertical timeline/stepper.
- [x] 2.2 Render completed, active, and pending states with distinct visual treatments.
- [x] 2.3 Add subtle active-state motion and completed-state indicators without using visually noisy decoration.
- [x] 2.4 Keep the stepper in a bounded vertical viewport so the card remains compact.
- [x] 2.5 Keep the stepper outside the generated document sheet and pending document body.

## 3. Auto-Scroll and Accessibility

- [x] 3.1 Automatically scroll the active step into view when the active step changes.
- [x] 3.2 Respect reduced-motion preferences by disabling smooth scroll and pulse-like motion while keeping state visible.
- [x] 3.3 Keep the stepper readable and understandable without relying on animation alone.

## 4. Behavior Preservation

- [x] 4.1 Preserve live/typewriter rendering for generated document text chunks.
- [x] 4.2 Preserve disabled print and export actions while a document is generating.
- [x] 4.3 Preserve realtime fallback, completion refetch, and final clean document rendering.
- [x] 4.4 Avoid backend, provider, API client, database, and SSE contract changes.

## 5. Tests

- [x] 5.1 Update document preview tests to expect the vertical planning stepper and richer step labels.
- [x] 5.2 Add regression coverage for completed, active, and pending step states.
- [x] 5.3 Add coverage that raw planning content and raw reasoning controls are still absent.
- [x] 5.4 Add coverage for active-step auto-scroll behavior without relying on animation timing.
- [x] 5.5 Keep existing coverage for live document content, fallback behavior, and disabled partial-content actions.

## 6. Validation

- [x] 6.1 Run focused document preview frontend tests.
- [x] 6.2 Run web typecheck.
- [x] 6.3 Run focused Biome check for touched frontend files.
