## Context

The preview already renders final document chunks progressively, and the planning card now gives a richer generation status. The remaining UX issue is viewport position: once the document sheet starts growing, the text can continue being typed below the fold while the visible page remains parked higher up.

This change is frontend-only and should attach to the existing live preview rendering path. It must not change the SSE contract, typewriter buffering, backend generation, or persisted document content.

## Goals / Non-Goals

**Goals:**

- Keep the viewport following the newest visible generated document text during live writing.
- Start following when the document sheet first appears from live generated content.
- Avoid fighting the user if they manually scroll upward or away from the live writing area.
- Resume following when the user scrolls back near the newest generated content.
- Respect reduced-motion preferences by using non-smooth scroll behavior when requested.
- Preserve final document rendering, planning stepper behavior, and export/print gating.

**Non-Goals:**

- Change how chunks are received, buffered, or smoothed into visible text.
- Add backend events or semantic generation milestones.
- Auto-scroll completed persisted documents after generation finishes.
- Scroll the planning stepper and document body with the same logic; the planning stepper already owns its own bounded scroll behavior.

## Decisions

1. Follow a sentinel at the end of the live document body.

   Add a small invisible element after the live markdown preview inside the document sheet. As visible live content grows, scroll that sentinel into view. This follows the text that is being written instead of trying to compute document height manually.

2. Only enable auto-follow for generating documents with live document content.

   Auto-follow should activate when `document.status === "generating"` and `liveDraftContent` is visible. Completed persisted documents should render normally without automatic movement.

3. Preserve user control with a near-bottom heuristic.

   Track the scroll container position. If the user is near the bottom/newest content, keep auto-follow enabled. If they scroll away beyond a threshold, pause auto-follow so they can read earlier sections. If they return near the bottom, resume following.

4. Respect reduced motion.

   Use smooth scrolling only when reduced motion is not preferred. When reduced motion is preferred, jump to the sentinel using non-smooth scroll while preserving the same follow/pause behavior.

5. Keep the implementation local to the preview UI.

   The auto-follow behavior should be implemented as a small hook/helper in the document preview UI file unless existing shared scroll utilities already exist. No API or backend surface should change.

## Risks / Trade-offs

- Auto-scroll can feel intrusive -> Pause whenever the user scrolls away from the live writing area.
- Near-bottom detection can be imperfect in nested scroll layouts -> Use the known preview scroll container and a forgiving threshold.
- Markdown layout can change after rendering -> Scroll on visible content length changes rather than only raw event arrival.
- Smooth scroll can be uncomfortable for some users -> Honor reduced-motion preferences.
