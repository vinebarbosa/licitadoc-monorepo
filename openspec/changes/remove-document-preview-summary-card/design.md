## Context

The document preview page now follows the validated `tmp/documento-preview.tsx` direction for completed previewable documents, but still has a standalone `DocumentLoadedSummary` card for generating, failed, and empty-content states. That card presents title, generated document code/process information, and last update in a separate square before the state content.

The requested adjustment is to remove that separate metadata square and keep the preview surface visually limited to the top action buttons and the document/preview state area.

## Goals / Non-Goals

**Goals:**
- Remove the standalone metadata summary card from the document preview page.
- Keep the top action row unchanged.
- Keep the completed document sheet layout unchanged.
- Keep non-content states functional without adding a title/process/update card above them.
- Preserve existing fetching, polling, route, breadcrumb, and Markdown-safety behavior.

**Non-Goals:**
- Redesign the document sheet itself.
- Remove document metadata that appears inside the validated document layout.
- Add or remove backend export behavior.
- Change document detail API contracts.

## Decisions

- Delete the summary-card component and its render paths.
  - Rationale: the validated UI should not show an extra metadata square; the preview should move directly from actions to document content or state content.
  - Alternative considered: hide only some fields in the summary card; rejected because the whole card is the unwanted visual element.

- Preserve existing state cards for generating, failed, and empty content.
  - Rationale: users still need clear state feedback, but that feedback should not be preceded by the metadata summary card.
  - Alternative considered: render the full document sheet for all states; rejected because generating/failed/empty states do not have successful document content to display.

## Risks / Trade-offs

- Tests may currently assert title/process/update metadata in state paths. → Update tests to assert action row and state message instead.
- Removing the summary card reduces context for non-content states. → Keep breadcrumbs and state copy as the primary context, and preserve document layout for completed previewable content.
