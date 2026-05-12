## 1. Auto-Follow Model

- [x] 1.1 Identify the document preview scroll container used by the live preview page.
- [x] 1.2 Add a live-writing endpoint/sentinel after the generated document body.
- [x] 1.3 Track whether auto-follow is enabled based on whether the user is near the newest live content.
- [x] 1.4 Pause auto-follow when the user scrolls away from the live writing endpoint.
- [x] 1.5 Resume auto-follow when the user returns near the live writing endpoint.

## 2. Live Writing Behavior

- [x] 2.1 Scroll the live-writing endpoint into view when live visible document content grows and auto-follow is enabled.
- [x] 2.2 Enable auto-follow only for generating documents with visible live document content.
- [x] 2.3 Stop auto-follow after completed persisted document detail is rendered.
- [x] 2.4 Preserve progressive typewriter rendering and snapshot reconciliation.

## 3. Accessibility and Motion

- [x] 3.1 Reuse or add reduced-motion detection for auto-follow scroll behavior.
- [x] 3.2 Use smooth scrolling only when reduced motion is not preferred.
- [x] 3.3 Ensure auto-follow does not interfere with reading earlier generated content.

## 4. Behavior Preservation

- [x] 4.1 Preserve the animated planning stepper and its independent scroll behavior.
- [x] 4.2 Preserve disabled print/export actions during generation.
- [x] 4.3 Preserve realtime fallback and completion refetch behavior.
- [x] 4.4 Avoid backend, provider, API client, database, and SSE contract changes.

## 5. Tests

- [x] 5.1 Add coverage that the live preview scrolls to the writing endpoint as typewriter content grows.
- [x] 5.2 Add coverage that auto-follow pauses when the user scrolls away from the live writing endpoint.
- [x] 5.3 Add coverage that auto-follow resumes when the user returns near the newest live content.
- [x] 5.4 Add coverage that reduced-motion preference uses non-smooth scrolling.
- [x] 5.5 Keep existing coverage for typewriter rendering, planning stepper, fallback behavior, and disabled partial-content actions.

## 6. Validation

- [x] 6.1 Run focused document preview frontend tests.
- [x] 6.2 Run web typecheck.
- [x] 6.3 Run focused Biome check for touched frontend files.
